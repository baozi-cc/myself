/*{
  "message" : "success",
  "data" : {
    "ttl" : 0,
    "message" : ""
  },
  "status" : 0
  直接返回写法,可能要写好几个文件
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
