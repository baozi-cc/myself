
/**

 */

let html = $response.body;



html =
  html.replace(/"receiveState":"2",/g, `"receiveState":"1",`);

html =
  html.replace(/"rollBeginTime":"\d\d:\d\d:\d\d",/g, `"rollBeginTime":"00:00:00",`);           

html =
  html.replace(/"cycleStock":0,/g, `"cycleStock":7,`); 

if (html.includes('</head>')) {
  html = '<script src="https://unpkg.com/vconsole@3.14.6/dist/vconsole.min.js" ignore></script><script ignore>new VConsole()</script>' + html;
}


$done({ body: html});

$done({ body:`
`});
