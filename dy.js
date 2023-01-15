/**
 */

let html = $response.body;

html =
  html.replace(/button_type":"2",/g, `button_type":"1",`);

html =
  html.replace(/"status":\d+,/g, `"status":1,`);


$done({ body: html});
