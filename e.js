/*{let html = $response.body;

html =
  html.replace(/num":[\d]/g, `num":100`);

html =
  html.replace(/ttl":\d+,/g, `ttl":0,`);

$done({ body: html});
}*/

let body = {
    "message" : "success",
  "data" : {
    "ttl" : 0,
    "message" : ""
  },
  "status" : 0
}
$done({ body: JSON.stringify(body) });
