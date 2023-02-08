let html = $response.body;

html =
  html.replace(/runstatus":302,/g, `runstatus":301,`);

html =
  html.replace(/isstockout":200,/g, `isstockout":100,`);

try {
html = JSON.parse(html);
let time = html.data.time - 0;
time += 1000 * 60 * 3;
// time += 1000 * 60 * 60 * 24;
html.data.time = new String(time);
} catch (err){
}

$done({ body: JSON.stringify(html)});
