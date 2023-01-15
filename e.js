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
    "message" : "活动每周四十点半开始,请耐心等待~"
  },
  "status" : 0
}
$done({ body: JSON.stringify(body) });
