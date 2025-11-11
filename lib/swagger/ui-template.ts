export function generateSwaggerUI(
  swaggerJsonPath: string,
  title: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.19.0/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .topbar {
      display: none;
    }
    .muzu-footer {
      position: fixed;
      bottom: 0;
      right: 0;
      padding: 8px 16px;
      font-size: 12px;
      color: #666;
      background: rgba(255, 255, 255, 0.9);
      border-top-left-radius: 4px;
      box-shadow: 0 -1px 3px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      z-index: 9999;
    }
    .muzu-footer a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }
    .muzu-footer a:hover {
      text-decoration: underline;
    }
    .muzu-footer .note-emoji {
      display: inline-block;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <div class="muzu-footer">
    Made with <span class="note-emoji">❤️</span> using <a href="https://muzu.dev" target="_blank">Muzu</a>
  </div>
  <script src="https://unpkg.com/swagger-ui-dist@5.19.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.19.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: '${swaggerJsonPath}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `.trim();
}
