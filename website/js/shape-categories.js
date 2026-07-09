/**
 * shape-categories.js
 * ===================
 * Milestone 4 — AWS / Azure / GCP Cloud Shape Library.
 *
 * Structure:
 *   - AWS:   Region → VPC → Availability Zone → Route Table  (fully implemented)
 *   - Azure: placeholder (Coming Soon items)
 *   - GCP:   placeholder (Coming Soon items)
 *
 * Each item carries:
 *   id, type (must match ShapeHierarchyModel.ShapeType), label,
 *   categoryId, svgIcon, parentType (null = canvas root)
 */

'use strict';

const ShapeCategories = (() => {

  // ── SVG helpers ────────────────────────────────────────────────────────────

  function _svgLine(c = '#10b981') {
    return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="6" y1="20" x2="34" y2="20" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  }

  function _svgCircle(c = '#6366f1') {
    return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="14" fill="${c}" fill-opacity="0.1" stroke="${c}" stroke-width="2"/>
    </svg>`;
  }

  function _svgRectangle(c = '#f59e0b') {
    return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="28" height="20" fill="${c}" fill-opacity="0.1" stroke="${c}" stroke-width="2"/>
    </svg>`;
  }

  function _svgAwsRegion(color) {
    return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="34" height="34" rx="2" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.8" stroke-dasharray="4 2"/>
      <!-- Globe -->
      <circle cx="20" cy="18" r="7" fill="none" stroke="${color}" stroke-width="1.5"/>
      <ellipse cx="20" cy="18" rx="3" ry="7" fill="none" stroke="${color}" stroke-width="1.5"/>
      <line x1="13" y1="18" x2="27" y2="18" stroke="${color}" stroke-width="1.5"/>
      <text x="20" y="32" text-anchor="middle" font-size="6.5" fill="${color}" font-family="sans-serif" font-weight="600">Region</text>
    </svg>`;
  }

  function _svgAwsVpc(color) {
    return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="34" height="34" rx="2" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.8" stroke-dasharray="4 2"/>
      <!-- Cloud -->
      <path d="M 13 21 C 13 17 18 16 19 14 C 21 11 26 12 27 15 C 31 16 31 22 27 24 L 15 24 C 11 24 11 22 13 21 Z" fill="none" stroke="${color}" stroke-width="1.5"/>
      <text x="20" y="32" text-anchor="middle" font-size="6.5" fill="${color}" font-family="sans-serif" font-weight="600">VPC</text>
    </svg>`;
  }

  function _svgAwsAz(color) {
    return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="34" height="34" rx="2" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.8" stroke-dasharray="4 2"/>
      <!-- Grid pattern -->
      <line x1="14" y1="14" x2="26" y2="14" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 1"/>
      <line x1="14" y1="18" x2="26" y2="18" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 1"/>
      <line x1="14" y1="22" x2="26" y2="22" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 1"/>
      <text x="20" y="32" text-anchor="middle" font-size="6.5" fill="${color}" font-family="sans-serif" font-weight="600">AZ</text>
    </svg>`;
  }

  function _svgAwsRouteTable() {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 85 85" fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(2.5, 2.5)"><g stroke="none"><path d="M0 2.634h80v21.333H0z" fill="#9d5025"/><path d="M0 0h80v20.762H0z" fill="#f58536"/><path d="M0 30.326h80v22.268H0z" fill="#9d5025"/><path d="M0 28.626h80v20.762H0z" fill="#f58536"/><path d="M0 58.433h80V80H0z" fill="#9d5025"/><path d="M0 56.02h80v20.762H0z" fill="#f58536"/><path d="M9.86 16.584H8.031V7.397h-2.39V6.099h.179c1.1 0 2.39-.285 2.689-1.895v-.246h1.338zM20.162 5.788c-2.033 3.202-3.269 6.922-3.585 10.796H14.64c.366-3.824 1.661-7.474 3.753-10.576h-4.995v-1.83h6.764zm8.174 10.796h-6.669c0-5.502 4.78-5.372 4.78-9.304 0-1.038-.406-1.907-1.422-1.907-1.374 0-1.589 1.298-1.589 2.595h-1.745c0-2.517.932-4.075 3.37-4.075.863-.117 1.729.195 2.355.851s.947 1.583.872 2.523c0 4.204-3.717 4.464-4.577 7.565h4.625zm3.86 0h-1.828v-2.349h1.84zm6.669 0h-1.828V7.397h-2.39V6.099h.179c1.099 0 2.39-.285 2.689-1.895v-.246h1.338zm6.884.247c-2.892 0-3.43-2.427-3.43-6.06s.633-6.851 3.585-6.851c2.008 0 3.083.999 3.083 3.075H47.17c0-.727-.311-1.648-1.195-1.648-1.721 0-1.817 2.518-1.817 4.36h0c.453-.857 1.315-1.36 2.223-1.298 1.566 0 2.82 1.298 2.82 3.776.048 2.92-1.028 4.659-3.454 4.659zm7.242-.247h-1.84v-2.349h1.84zm5.366.247c-2.199 0-3.418-1.531-3.418-6.488s1.195-6.488 3.418-6.488 3.418 1.544 3.418 6.488-1.231 6.501-3.418 6.501zm7.171-.247h-1.805v-2.349h1.84zm5.366.247c-2.199 0-3.418-1.531-3.418-6.488s1.195-6.488 3.418-6.488 3.418 1.544 3.418 6.488-1.195 6.501-3.382 6.501zm.035 15.753c2.187 0 3.418 1.531 3.418 6.488s-1.195 6.488-3.418 6.488-3.442-1.583-3.442-6.527 1.195-6.449 3.442-6.449zm-7.171 10.29h1.84v2.401h-1.876zm-8.27-8.149h.179c1.099 0 2.39-.285 2.689-1.895v-.247h1.339v12.691h-1.876v-9.226h-2.39zm-4.302 8.149h1.84v2.401H51.15zm-5.211-10.29c2.008 0 3.083.999 3.083 3.076H47.17c0-.727-.311-1.648-1.195-1.648-1.721 0-1.817 2.517-1.817 4.36h0c.453-.857 1.315-1.36 2.223-1.298 1.566 0 2.82 1.298 2.82 3.776 0 2.92-1.076 4.646-3.502 4.646-2.892 0-3.43-2.427-3.43-6.06s.681-6.852 3.705-6.852zm-11.294 2.141h.179c1.1 0 2.39-.285 2.689-1.895v-.247h1.339v12.691h-1.852v-9.226h-2.39zm-4.302 8.149h1.84v2.401h-1.852zm-5.33-8.863c-1.374 0-1.59 1.298-1.59 2.595H21.69c0-2.517.932-4.075 3.37-4.075.863-.117 1.729.195 2.355.85s.947 1.583.872 2.523c0 4.204-3.717 4.464-4.577 7.552h4.625v1.817h-6.669c0-5.502 4.78-5.372 4.78-9.317 0-1.064-.406-1.947-1.422-1.947zm-11.64-1.181h6.752v1.609c-2.033 3.203-3.268 6.922-3.585 10.796H14.64c.366-3.824 1.661-7.473 3.753-10.576h-4.995zm-7.732 1.895h.179c1.1 0 2.39-.285 2.689-1.895v-.247h1.339v12.691H8.031v-9.226h-2.39zm65.252 25.278c2.187 0 3.418 1.531 3.418 6.488s-1.195 6.488-3.418 6.488-3.442-1.622-3.442-6.527 1.195-6.449 3.442-6.449zm-7.171 10.29h1.84v2.362h-1.876zm-5.33-8.863c-1.374 0-1.589 1.298-1.589 2.595h-1.793c0-2.517.932-4.075 3.37-4.075.863-.117 1.729.195 2.355.85s.947 1.583.872 2.523c0 4.191-3.705 4.464-4.577 7.552h4.625v1.778h-6.669c0-5.502 4.78-5.385 4.78-9.317 0-1.038-.394-1.907-1.41-1.907zm-7.23 8.863h1.84v2.362H51.15zm-5.223-10.29c2.008 0 3.083.999 3.083 3.075H47.17c0-.74-.311-1.648-1.195-1.648-1.721 0-1.817 2.517-1.817 4.36h0c.453-.857 1.315-1.36 2.223-1.298 1.566 0 2.82 1.298 2.82 3.776 0 2.92-1.076 4.646-3.502 4.646-2.892 0-3.43-2.427-3.43-6.06s.681-6.852 3.705-6.852zM34.67 62.144h.179c1.099 0 2.39-.285 2.689-1.895v-.247h1.338v12.652h-1.84v-9.213h-2.39zm-4.302 8.149h1.84v2.362h-1.84zm-5.33-8.863c-1.374 0-1.59 1.298-1.59 2.595h-1.757c0-2.517.932-4.075 3.37-4.075.863-.117 1.729.195 2.355.85s.947 1.583.872 2.523c0 4.191-3.717 4.464-4.577 7.552h4.625v1.778h-6.669c0-5.502 4.78-5.385 4.78-9.317 0-1.038-.406-1.907-1.422-1.907zm-11.64-1.181h6.764v1.609c-2.033 3.203-3.268 6.922-3.585 10.796H14.64c.366-3.824 1.661-7.474 3.753-10.576h-4.995zm-7.744 1.895h.179c1.1 0 2.39-.285 2.689-1.895v-.247H9.86v12.652H8.031v-9.213h-2.39z"/><g fill="#f58536"><use xlink:href="#C_RT"/><use xlink:href="#C_RT" x="12.573"/><use xlink:href="#D_RT"/><use xlink:href="#E_RT"/><use xlink:href="#D_RT" y="27.419"/><use xlink:href="#E_RT" y="27.419"/><use xlink:href="#E_RT" y="-28.639"/></g></g></g><defs ><path id="C_RT" d="M58.357 5.554c-1.255 0-1.578 1.298-1.578 5.022s.323 5.022 1.578 5.022 1.578-1.298 1.578-5.022-.323-5.022-1.578-5.022z"/><path id="D_RT" d="M70.93 44.237c1.255 0 1.578-1.298 1.578-5.022s-.323-5.022-1.578-5.022-1.578 1.298-1.578 5.022.311 5.022 1.578 5.022z"/><path id="E_RT" d="M45.904 44.237c1.123 0 1.518-1.298 1.518-2.712 0-1.752-.466-2.738-1.518-2.738-1.339 0-1.578 1.298-1.578 2.829s.454 2.621 1.578 2.621z"/></defs></svg>`;
  }

  function _svgAwsEc2() {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 74.375 85" fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(2.188, 2.5)"><g stroke="none"><path d="M3.511 14.898L0 16.56V63.44l3.511 1.662 14.209-23.887L3.511 14.898z" fill="#9d5025"/><path d="M11.694 63.285l-8.183 1.817V14.898l8.183 1.769v46.618z" fill="#f58536"/><path d="M7.382 13.061l4.312-2.031 20.483 31.079L11.694 68.97l-4.312-2.031V13.061z" fill="#9d5025"/><path d="M21.899 66.239L11.694 68.97V11.03l10.205 2.74v52.468z" fill="#f58536"/><path d="M16.499 8.746l5.4-2.556 30.216 39.32-30.216 28.299-5.4-2.556V8.746z" fill="#9d5025"/><path d="M34.989 69.281l-13.09 4.529V6.19l13.09 4.538v58.552z" fill="#f58536"/><path d="M28.008 3.304L34.99 0l32.69 42.264L34.99 80l-6.982-3.304V3.304z" fill="#9d5025"/><path d="M70 63.431L34.99 80V0L70 16.57v46.861z" fill="#f58536"/></g></g></svg>`;
  }

  function _svgAwsIgw() {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 85 85" fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(2.5, 2.5)"><g fill="#9d5025" stroke="none"><path d="M0 41.579C0 20.293 17.84 3.157 40 3.157s40 17.136 40 38.422S62.16 80 40 80 0 62.864 0 41.579z"/><path d="M0 38.422h80v3.157H0z"/></g><path d="M0 38.422C0 17.136 17.84 0 40 0s40 17.136 40 38.422-17.84 38.422-40 38.422S0 59.707 0 38.422z" fill="#f58536" stroke="none"/><path d="M9.846 42.235v-.972c.292-4.556 3.121-8.607 7.401-10.593.354-6.873 5.368-12.706 12.328-14.341s14.21 1.317 17.827 7.258c2.496-1.02 5.338-.9 7.731.326s4.079 3.428 4.586 5.987c6.034 1.136 10.385 6.679 10.385 11.364v.922c0 5.682-6.126 10.669-13.145 10.669H22.912c-6.94.051-13.066-4.937-13.066-10.618z" stroke="none"/><path d="M48.216 27.677l-2.55 1.679-1.315-2.702c-1.932-4.14-6.2-6.818-10.923-6.856-3.199 0-6.267 1.222-8.528 3.396s-3.529 5.122-3.526 8.195v2.147l-1.893.53c-3.11 1.203-5.246 3.988-5.521 7.197v.922c0 3.119 3.944 6.742 9.004 6.742h34.124c5.061 0 8.991-3.624 8.991-6.742v-.922c0-3.131-3.641-7.26-7.887-7.576l-2.287-.177-.131-2.172c-.063-1.691-1.081-3.214-2.655-3.974s-3.453-.635-4.904.325z" fill="#f58536" stroke="none"/></g></svg>`;
  }

  function _svgAwsNat() {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 85 85" fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(2.5, 2.5)"><g stroke="none"><path d="M0 41.579C0 20.293 17.84 3.157 40 3.157s40 17.136 40 38.422S62.16 80 40 80 0 62.864 0 41.579z" fill="#9d5025"/><path d="M0 38.422C0 17.136 17.84 0 40 0s40 17.136 40 38.422-17.84 38.422-40 38.422S0 59.707 0 38.422z" fill="#f58536"/><path d="M50.832 20.581h4.22V56.25h-4.22zm11.856 9.028l11.042 8.636-11.042 8.99V29.609z"/><path d="M23.661 36.402l2.406 1.869-2.668 2.172h41.157v-4.04H23.661zm-.263-13.788h31.653v-4.053h-31.39l2.406 1.881-2.668 2.172zm2.668 33.497l-2.668 2.172h31.653V54.23h-31.39l2.406 1.881zM14.604 31.364l8.833 6.906-8.833 7.21V31.364z"/><path d="M14.604 13.535l8.833 6.907-8.833 7.197V13.535zm0 35.67l8.833 6.907-8.833 7.197V49.205z"/></g></g></svg>`;
  }

  function _svgAwsSubnet(color) {
    return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="34" height="34" rx="2" fill="${color}" fill-opacity="0.10" stroke="${color}" stroke-width="1.8" stroke-dasharray="4 2"/>
      <!-- Subnet stacked layers -->
      <rect x="10" y="12" width="20" height="5" rx="1" fill="${color}" fill-opacity="0.35" stroke="none"/>
      <rect x="10" y="19" width="20" height="5" rx="1" fill="${color}" fill-opacity="0.20" stroke="none"/>
      <text x="20" y="32" text-anchor="middle" font-size="5.8" fill="${color}" font-family="sans-serif" font-weight="600">Subnet</text>
    </svg>`;
  }

  function _svgAwsLambda() {
    // Unique gradient ID per call to avoid browser SVG ID collisions
    const uid = 'lg-lam-' + Math.random().toString(36).slice(2, 8);
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="${uid}">
          <stop stop-color="#C8511B" offset="0%"/>
          <stop stop-color="#FF9900" offset="100%"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="80" fill="url(#${uid})"/>
      <path d="M28.0075352,66 L15.5907274,66 L29.3235885,37.296 L35.5460249,50.106 L28.0075352,66 Z M30.2196674,34.553 C30.0512768,34.208 29.7004629,33.989 29.3175745,33.989 L29.3145676,33.989 C28.9286723,33.99 28.5778583,34.211 28.4124746,34.558 L13.097944,66.569 C12.9495999,66.879 12.9706487,67.243 13.1550766,67.534 C13.3374998,67.824 13.6582439,68 14.0020416,68 L28.6420072,68 C29.0299071,68 29.3817234,67.777 29.5481094,67.428 L37.563706,50.528 C37.693006,50.254 37.6920037,49.937 37.5586944,49.665 L30.2196674,34.553 Z M64.9953491,66 L52.6587274,66 L32.866809,24.57 C32.7014253,24.222 32.3486067,24 31.9617091,24 L23.8899822,24 L23.8990031,14 L39.7197081,14 L59.4204149,55.429 C59.5857986,55.777 59.9386172,56 60.3255148,56 L64.9953491,56 L64.9953491,66 Z M65.9976745,54 L60.9599868,54 L41.25928,12.571 C41.0938963,12.223 40.7410777,12 40.3531778,12 L22.89768,12 C22.3453987,12 21.8963569,12.447 21.8953545,12.999 L21.884329,24.999 C21.884329,25.265 21.9885708,25.519 22.1780103,25.707 C22.3654452,25.895 22.6200358,26 22.8866544,26 L31.3292417,26 L51.1221625,67.43 C51.2885485,67.778 51.6393624,68 52.02626,68 L65.9976745,68 C66.5519605,68 67,67.552 67,67 L67,55 C67,54.448 66.5519605,54 65.9976745,54 L65.9976745,54 Z" fill="#FFFFFF"/>
    </svg>`;
  }

  /** Coming Soon placeholder */
  function _placeholderRect(color) {
    return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="4"
            fill="${color}" fill-opacity="0.06"
            stroke="${color}" stroke-width="1.4" stroke-dasharray="3 3"/>
      <text x="20" y="24" text-anchor="middle" font-size="5.5"
            fill="${color}" font-family="sans-serif">Soon</text>
    </svg>`;
  }

  // ── Category definitions ──────────────────────────────────────────────────

  const _categories = [
    {
      id:           'basic-shapes',
      name:         'Basic Shapes',
      icon:         _svgRectangle('#6366f1'),
      displayOrder: 0,
      isPlaceholder: false,
    },
    {
      id:           'aws',
      name:         'AWS',
      icon:         _svgAwsRegion('#f59e0b'),
      displayOrder: 1,
      isPlaceholder: false,
    },
    {
      id:           'azure',
      name:         'Azure',
      icon:         _placeholderRect('#0ea5e9'),
      displayOrder: 2,
      isPlaceholder: true,
      placeholderMessage: 'Azure shapes — Coming Soon',
    },
    {
      id:           'gcp',
      name:         'GCP',
      icon:         _placeholderRect('#10b981'),
      displayOrder: 3,
      isPlaceholder: true,
      placeholderMessage: 'GCP shapes — Coming Soon',
    },
  ];

  // ── Items per category ────────────────────────────────────────────────────

  const _itemsByCategory = {

    // ── Basic Shapes ───────────────────────────────────────────────
    'basic-shapes': [
      {
        id:         'shape-line',
        type:       'line',
        label:      'Line',
        categoryId: 'basic-shapes',
        parentType: null,
        svgIcon:    _svgLine('#10b981'),
        defaultWidth:  80,
        defaultHeight: 0,
        fillColor:  '#10b981',
        strokeColor:'#10b981',
      },
      {
        id:         'shape-circle',
        type:       'circle',
        label:      'Circle',
        categoryId: 'basic-shapes',
        parentType: null,
        svgIcon:    _svgCircle('#6366f1'),
        defaultWidth:  80,
        defaultHeight: 80,
        fillColor:  '#6366f1',
        strokeColor:'#6366f1',
      },
      {
        id:         'shape-rectangle',
        type:       'rectangle',
        label:      'Rectangle',
        categoryId: 'basic-shapes',
        parentType: null,
        svgIcon:    _svgRectangle('#f59e0b'),
        defaultWidth:  100,
        defaultHeight: 60,
        fillColor:  '#f59e0b',
        strokeColor:'#f59e0b',
      },
    ],

    // ── AWS ────────────────────────────────────────────────────────
    'aws': [
      {
        id:         'aws-region',
        type:       'aws-region',
        label:      'Region',
        categoryId: 'aws',
        parentType: null,           // overridden by CSV
        svgIcon:    _svgAwsRegion('#f59e0b'),
        defaultWidth:  360,
        defaultHeight: 280,
        fillColor:  '#f59e0b',
        strokeColor:'#f59e0b',
      },
      {
        id:         'aws-vpc',
        type:       'aws-vpc',
        label:      'VPC',
        categoryId: 'aws',
        parentType: null,  // overridden by CSV
        svgIcon:    _svgAwsVpc('#6366f1'),
        defaultWidth:  280,
        defaultHeight: 220,
        fillColor:  '#6366f1',
        strokeColor:'#6366f1',
      },
      {
        id:         'aws-availability-zone',
        type:       'aws-availability-zone',
        label:      'Availability Zone',
        categoryId: 'aws',
        parentType: null,     // overridden by CSV
        svgIcon:    _svgAwsAz('#0ea5e9'),
        defaultWidth:  200,
        defaultHeight: 160,
        fillColor:  '#0ea5e9',
        strokeColor:'#0ea5e9',
      },
      {
        id:             'aws-route-table',
        type:           'aws-route-table',
        label:          'Route Table',
        categoryId:     'aws',
        parentType:     null,
        geometryType:   'rectangle',    // Milestone 2 rectangle geometry
        transparentFill: true,          // SVG provides its own orange background
        svgIcon:        _svgAwsRouteTable('#10b981'),
        defaultWidth:   140,
        defaultHeight:  80,
        fillColor:      '#10b981',
        strokeColor:    '#10b981',
      },
      {
        id:              'aws-ec2',
        type:            'aws-ec2',
        label:           'EC2',
        categoryId:      'aws',
        parentType:      null,
        geometryType:    'rectangle',   // Milestone 2 rectangle geometry
        transparentFill: true,          // No background fill
        svgIcon:         _svgAwsEc2('#f59e0b'),
        defaultWidth:    60,
        defaultHeight:   60,
        fillColor:       '#f59e0b',
        strokeColor:     '#f59e0b',
      },
      {
        id:                'aws-igw',
        type:              'aws-igw',
        label:             'Internet Gateway',
        categoryId:        'aws',
        parentType:        null,
        geometryType:      'circle',    // Milestone 3 circle geometry (COC)
        svgIcon:           _svgAwsIgw('#f58536'),
        defaultWidth:      60,
        defaultHeight:     60,
        fillColor:         '#f58536',
        strokeColor:       '#f58536',
        // ── M8: Circle On Container edge-attachment ──────────────
        edgeAttachment:    true,        // routes drop to COC pipeline
        edgeContainerType: 'aws-vpc',  // must match shape type in canvas
        baseShapeType:     'circle-on-container',
      },
      {
        id:            'aws-nat',
        type:          'aws-nat',
        label:         'NAT Gateway',
        categoryId:    'aws',
        parentType:    null,
        geometryType:  'circle',        // Milestone 3 circle geometry
        transparentFill: true,          // SVG provides its own orange circle
        svgIcon:       _svgAwsNat('#f58536'),
        defaultWidth:  60,
        defaultHeight: 60,
        fillColor:     '#f58536',
        strokeColor:   '#f58536',
      },
      // ── M9: AWS Subnet (rectangle container, dashed teal) ───────────
      {
        id:             'aws-subnet',
        type:           'aws-subnet',
        label:          'AWS Subnet',
        categoryId:     'aws',
        parentType:     null,           // overridden by CSV → aws-availability-zone
        geometryType:   'rectangle',
        isContainer:    true,
        svgIcon:        _svgAwsSubnet('#00a4a6'),
        defaultWidth:   200,
        defaultHeight:  160,
        fillColor:      '#00a4a6',
        strokeColor:    '#00a4a6',
      },
      // ── M9: AWS Lambda (rectangle with embedded SVG icon) ───────────
      {
        id:              'aws-lambda',
        type:            'aws-lambda',
        label:           'AWS Lambda',
        categoryId:      'aws',
        parentType:      null,           // overridden by CSV → aws-subnet
        geometryType:    'rectangle',
        transparentFill: true,           // Lambda SVG has its own gradient background
        svgIcon:         _svgAwsLambda(),
        defaultWidth:    60,
        defaultHeight:   60,
        fillColor:       '#FF9900',
        strokeColor:     '#FF9900',
      },
    ],

    // ── Azure (placeholder items) ────────────────────────────────
    'azure': [
      {
        id:         'azure-coming-soon',
        type:       'azure-placeholder',
        label:      'Coming Soon',
        categoryId: 'azure',
        parentType: null,
        isPlaceholder: true,
        svgIcon:    _placeholderRect('#0ea5e9'),
      },
    ],

    // ── GCP (placeholder items) ──────────────────────────────────
    'gcp': [
      {
        id:         'gcp-coming-soon',
        type:       'gcp-placeholder',
        label:      'Coming Soon',
        categoryId: 'gcp',
        parentType: null,
        isPlaceholder: true,
        svgIcon:    _placeholderRect('#10b981'),
      },
    ],
  };

  // ── Public API ────────────────────────────────────────────────────────────

  function loadShapeCategories() {
    return [..._categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  function getCategoryItems(categoryId) {
    if (!categoryId || typeof categoryId !== 'string') return [];
    return (_itemsByCategory[categoryId] || []).slice();
  }

  function getCategoryById(categoryId) {
    return _categories.find(c => c.id === categoryId) || null;
  }

  function getCategoryCount(categoryId) {
    // Don't count Coming Soon placeholders in the badge
    const items = (_itemsByCategory[categoryId] || []);
    return items.filter(i => !i.isPlaceholder).length;
  }

  function sortShapeCategories(categories) {
    return [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /** Returns the item definition by its type string — used by drop validator */
  function getItemByType(type) {
    for (const items of Object.values(_itemsByCategory)) {
      const found = items.find(i => i.type === type);
      if (found) return found;
    }
    return null;
  }

  function getAllItems() {
    let all = [];
    for (const items of Object.values(_itemsByCategory)) {
      all = all.concat(items);
    }
    return all;
  }

  return {
    loadShapeCategories,
    getCategoryItems,
    getCategoryById,
    getCategoryCount,
    sortShapeCategories,
    getItemByType,
    getAllItems,
  };

})();
