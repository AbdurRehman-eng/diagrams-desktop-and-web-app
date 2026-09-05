/**
 * temporary-action-file.js
 * =======================
 * Builds the GML AWS Temporary Actions File representation from the uncommitted canvas state.
 * Saves the file atomically on the local backend server.
 */

'use strict';

const TemporaryActionFile = (() => {

  const BASE_URL = '/api/DiagramActions';

  async function update() {
    const activeDiagram = CanvasState.getActiveDiagram();
    if (!activeDiagram) return;

    const diagramId = activeDiagram.DiagramID;
    
    // Check if there are any uncommitted AWS cloud operations/resources on the canvas
    const shapes = CanvasState.getShapes() || [];
    const cocs = CanvasState.getCircleOnContainers() || [];
    
    const hasAwsShapes = shapes.some(s => s.Type.toLowerCase().startsWith('aws-'));
    const hasAwsCocs = cocs.some(c => c.DeviceOnContainerEdgeType === 'Internet Gateway' || c.DeviceOnContainerEdgeType.toLowerCase().startsWith('aws-'));
    
    if (!hasAwsShapes && !hasAwsCocs) {
      // Delete temp actions file if it was previously created but now empty of AWS components
      try {
        await fetch(`${BASE_URL}/temp/delete/${diagramId}`, { method: 'DELETE' });
      } catch (_) {}
      return;
    }

    // Determine region from first Region shape
    const regionShape = shapes.find(s => s.Type === 'aws-region');
    let regionName = 'Ohio'; // Default fallback
    if (regionShape) {
      regionName = regionShape.Label || 'Ohio';
    }

    // Build the GML temporary actions lines
    const lines = [];
    lines.push('# GML AWS Temporary Action File');
    lines.push('# Status: TEMP');
    lines.push(`# Region: ${regionName}`);
    lines.push('');

    let lineIndex = 1;

    // 1. Creations
    // Ordering: Regions -> VPCs -> AZs -> Subnets -> Route Tables -> IGWs (COCs) -> EC2s -> Lambdas
    
    // A. Regions
    const awsRegions = shapes.filter(s => s.Type === 'aws-region');
    awsRegions.forEach(r => {
      const regName = r.Label || r.AwsRegionSelection || 'Ohio';
      lines.push(`${_pad(lineIndex++)} | Create Region "${regName}"`);
    });

    // B. VPCs
    const awsVpcs = shapes.filter(s => s.Type === 'aws-vpc');
    awsVpcs.forEach(vpc => {
      // Find parent Region
      const parentReg = shapes.find(s => s.ShapeID === vpc.ParentContainerID);
      const regName = parentReg ? (parentReg.Label || 'Ohio') : 'Ohio';
      const cidr = vpc.AwsCidr || '10.0.0.0/16';
      lines.push(`${_pad(lineIndex++)} | Create VPC "${vpc.ShapeID}" inside Region "${regName}" with CIDR "${cidr}"`);
    });

    // C. AZs
    const awsAzs = shapes.filter(s => s.Type === 'aws-availability-zone');
    awsAzs.forEach(az => {
      const parentVpc = shapes.find(s => s.ShapeID === az.ParentContainerID);
      const vpcId = parentVpc ? parentVpc.ShapeID : 'unknown-vpc';
      lines.push(`${_pad(lineIndex++)} | Create Availability Zone "${az.ShapeID}" inside VPC "${vpcId}"`);
    });

    // D. Subnets
    const awsSubnets = shapes.filter(s => s.Type === 'aws-subnet');
    awsSubnets.forEach(sub => {
      const parentAz = shapes.find(s => s.ShapeID === sub.ParentContainerID);
      const azId = parentAz ? parentAz.ShapeID : 'unknown-az';
      
      // Find grandparent VPC
      const parentVpc = parentAz ? shapes.find(s => s.ShapeID === parentAz.ParentContainerID) : null;
      const vpcId = parentVpc ? parentVpc.ShapeID : 'unknown-vpc';
      
      const cidr = sub.AwsCidr || '10.0.1.0/24';
      lines.push(`${_pad(lineIndex++)} | Create Subnet "${sub.ShapeID}" inside Availability Zone "${azId}" of VPC "${vpcId}" with CIDR "${cidr}"`);
    });

    // E. Route Tables
    const awsRts = shapes.filter(s => s.Type === 'aws-route-table');
    awsRts.forEach(rt => {
      const parentVpc = shapes.find(s => s.ShapeID === rt.ParentContainerID);
      const vpcId = parentVpc ? parentVpc.ShapeID : 'unknown-vpc';
      lines.push(`${_pad(lineIndex++)} | Create Route Table "${rt.ShapeID}" inside VPC "${vpcId}"`);
    });

    // F. Internet Gateways (CircleOnContainers)
    const awsIgws = cocs.filter(c => c.DeviceOnContainerEdgeType === 'Internet Gateway');
    awsIgws.forEach(igw => {
      const parentVpc = shapes.find(s => s.ShapeID === igw.ParentContainerID);
      const parentReg = parentVpc ? shapes.find(s => s.ShapeID === parentVpc.ParentContainerID) : null;
      const regName = parentReg ? (parentReg.Label || 'Ohio') : 'Ohio';
      
      lines.push(`${_pad(lineIndex++)} | Create Internet Gateway "${igw.CircleOnContainerID}" inside Region "${regName}"`);
    });

    // G. EC2 Instances
    const awsEc2s = shapes.filter(s => s.Type === 'aws-ec2');
    awsEc2s.forEach(ec2 => {
      const parentSubnet = shapes.find(s => s.ShapeID === ec2.ParentContainerID);
      const subnetId = parentSubnet ? parentSubnet.ShapeID : 'unknown-subnet';
      lines.push(`${_pad(lineIndex++)} | Create EC2 Instance "${ec2.ShapeID}" inside Subnet "${subnetId}"`);
    });

    // H. Lambda Functions
    const awsLambdas = shapes.filter(s => s.Type === 'aws-lambda');
    awsLambdas.forEach(lambda => {
      const parentSubnet = shapes.find(s => s.ShapeID === lambda.ParentContainerID);
      const subnetId = parentSubnet ? parentSubnet.ShapeID : 'unknown-subnet';
      lines.push(`${_pad(lineIndex++)} | Create Lambda Function "${lambda.ShapeID}" inside Subnet "${subnetId}"`);
    });

    // I. NAT Gateways
    const awsNats = shapes.filter(s => s.Type === 'aws-nat');
    awsNats.forEach(nat => {
      const parentSubnet = shapes.find(s => s.ShapeID === nat.ParentContainerID);
      const subnetId = parentSubnet ? parentSubnet.ShapeID : 'unknown-subnet';
      lines.push(`${_pad(lineIndex++)} | Create NAT Gateway "${nat.ShapeID}" inside Subnet "${subnetId}"`);
    });

    // 2. Attachments
    const connections = activeDiagram.Connections || [];

    // A. VPC Peering Links
    const peeringConns = connections.filter(c => c.ConnectionType === 'VPC Peer link');
    peeringConns.forEach(conn => {
      lines.push(`${_pad(lineIndex++)} | Attach VPC Peering "${conn.ConnectionID}" between VPC "${conn.SourceItemID}" and VPC "${conn.DestinationItemID}"`);
    });

    // B. Internet Gateway Attachments
    awsIgws.forEach(igw => {
      lines.push(`${_pad(lineIndex++)} | Attach Internet Gateway "${igw.CircleOnContainerID}" to VPC "${igw.ParentContainerID}"`);
    });

    // C. Subnet Associations (Subnet to Route Table connections)
    // Find connections where one end is Subnet and the other is Route Table
    connections.forEach(conn => {
      const srcShape = shapes.find(s => s.ShapeID === conn.SourceItemID);
      const dstShape = shapes.find(s => s.ShapeID === conn.DestinationItemID);
      
      if (srcShape && dstShape) {
        if (srcShape.Type === 'aws-subnet' && dstShape.Type === 'aws-route-table') {
          lines.push(`${_pad(lineIndex++)} | Attach Subnet "${srcShape.ShapeID}" to Route Table "${dstShape.ShapeID}"`);
        } else if (srcShape.Type === 'aws-route-table' && dstShape.Type === 'aws-subnet') {
          lines.push(`${_pad(lineIndex++)} | Attach Subnet "${dstShape.ShapeID}" to Route Table "${srcShape.ShapeID}"`);
        }
      }
    });

    // D. Route Table Attachments (Route Table to Internet Gateway connections)
    // Find connections where one end is Route Table and the other is IGW (COC)
    connections.forEach(conn => {
      const srcShape = shapes.find(s => s.ShapeID === conn.SourceItemID);
      const dstShape = shapes.find(s => s.ShapeID === conn.DestinationItemID);
      const srcCoc = cocs.find(c => c.CircleOnContainerID === conn.SourceItemID);
      const dstCoc = cocs.find(c => c.CircleOnContainerID === conn.DestinationItemID);

      if (srcShape && srcShape.Type === 'aws-route-table' && dstCoc && dstCoc.DeviceOnContainerEdgeType === 'Internet Gateway') {
        lines.push(`${_pad(lineIndex++)} | Attach Route Table "${srcShape.ShapeID}" to Internet Gateway "${dstCoc.CircleOnContainerID}"`);
      } else if (dstShape && dstShape.Type === 'aws-route-table' && srcCoc && srcCoc.DeviceOnContainerEdgeType === 'Internet Gateway') {
        lines.push(`${_pad(lineIndex++)} | Attach Route Table "${dstShape.ShapeID}" to Internet Gateway "${srcCoc.CircleOnContainerID}"`);
      }
    });

    const actionsText = lines.join('\n') + '\n';
    console.log('[TemporaryActionFile] Generating actions:\n', actionsText);

    // Write to backend
    try {
      const response = await fetch(`${BASE_URL}/temp/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DiagramID: diagramId, ActionsText: actionsText })
      });
      if (!response.ok) throw new Error('Save failed on server');
      console.log('[TemporaryActionFile] Temp action file updated.');
    } catch (err) {
      console.warn('[TemporaryActionFile] Failed to save temp actions on backend:', err);
    }
  }

  function _pad(num) {
    return num.toString().padStart(3, '0');
  }

  return { update };
})();
