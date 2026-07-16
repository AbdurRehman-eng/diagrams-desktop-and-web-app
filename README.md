# Diagrams Hybrid Desktop & Web App

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Platform](https://img.shields.io/badge/platform-windows-blue.svg)](#)
[![Framework](https://img.shields.io/badge/.NET-10.0--MAUI-purple.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#)

A hybrid desktop and web application for drawing interactive hierarchical system diagrams (e.g., AWS cloud architectures). This app embeds a high-performance interactive HTML5 SVG canvas inside a native Windows desktop shell powered by **.NET MAUI** and **Windows App SDK (WinUI 3)**.

## 🏗️ Project Architecture

The repository is organized into distinct modular layers separating native Windows desktop integration, core business logic/persistence, front-end web client, and installer packaging:

```
├── DiagramsDesktop/            # Main .NET MAUI desktop app shell
│   └── wwwroot/                # Frontend web assets (HTML5, Vanilla CSS, JS Engine)
│       ├── css/                # Layouts, themes, shape and connection styles
│       ├── data/               # Static connection rules and schemas
│       └── js/                 # Canvas engine, event handlers, and geometry utilities
├── DiagramsDesktop.Core/       # Core backend, SQLite repository, and API controllers
├── DiagramsDesktop.Tests/      # Backend service unit test suite
├── DiagramsDesktop.Installer/  # WiX Toolset project compiling the Windows MSI installer
└── DiagramsDesktop.slnx        # Visual Studio XML solution file
```

## ✨ Key Features

- **Hierarchical Layouts & Containers**: Organize diagrams using parent-child container boundaries (such as VPCs, Regions, and Subnets).
- **Subtree Selection & Dragging**: Moving or dragging a container automatically cascades and moves all of its nested child shapes (subtrees) recursively.
- **Auto-Fitting & Protection Padding**: Smart boundary validations enforce that child shapes remain within their container parents. Enforces safety margins via protection padding.
- **Edge-Attached Elements**: Attach node controls (e.g. CircleOnContainer) directly onto container edges, which automatically slide along the boundaries during moves and resizes.
- **Smart Connection Engine**: Dynamic routing of connection lines (shortest path) with custom endcap decorators, left-click line selection, and deletion support.
- **SVG Attachment Integration**: Upload and embed custom SVG images inside container shapes with aspect-ratio scaling options (fit-aspect, fit-stretch, customized offsets) and automatic scaling host coupling.
- **Local Database Persistence**: Built-in high-performance SQLite engine that automatically saves and retrieves diagram configurations locally.

## 🛠️ Getting Started

### Prerequisites

To build and run this application locally, ensure you have the following installed:
- **.NET 10 SDK** (with MAUI workload)
- **Node.js** (for running the frontend test suite)

### Building the Solution

Compile the entire solution (excluding the installer) using the .NET CLI:
```bash
dotnet build
```

### Running the App Locally

To launch the desktop application directly in debug mode:
```bash
dotnet run --project DiagramsDesktop/DiagramsDesktop.csproj
```

### Running Frontend Unit Tests

Run the frontend test suite verifying milestones 11 and 12 logic (nested subtree move, protection padding, SVG validation, scaling, and attachment management):
```bash
cd DiagramsDesktop/wwwroot/js
node run_m11_m12_tests.js
```

## 📦 Publishing & Deployment (MSI Installer)

We use the **WiX Toolset (v4)** to harvest, package, and generate standard, clean Windows MSI setup installers.

To build the MSI installer package:
```bash
dotnet build DiagramsDesktop.Installer/DiagramsDesktop.Installer.wixproj -c Release
```

The build command automatically:
1. Publishes the MAUI desktop application as a self-contained, unpackaged `win-x64` executable to `publish/DiagramsDesktop`.
2. Cleans up extra satellite folders.
3. Harvests files and links them into a single setup package.

The generated installer will be created at:
📂 `DiagramsDesktop.Installer\bin\Release\DiagramsDesktop-1.0.0-Setup.msi`

## 📄 License

This project is licensed under the MIT License.
