let body = {
  "errno": "10000",
  "data": [{
    "pool_code": 2
  }],
  "errmsg": "数据返回成功！"
}
$done({ body: JSON.stringify(body) });
