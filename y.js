let html = $response.body;
html =
  html.replace(/"curDate":\d+?,/g, `"curDate": 0000000000000,`);
$done({ body: html});
