
/**

 */

let html = $response.body;


 html =
  html.replace(/"status":\d+?,/g, `"status":0,`);

            
            

if (html.includes('</head>')) {
  html = '<script src="https://unpkg.com/vconsole@3.14.6/dist/vconsole.min.js" ignore></script><script ignore>new VConsole()</script>' + html;
}


$done({ body: html});
