/* 
打开活动页面自动注入console，需要手动执行脚本

[rewrite_local]

https?://plogin.m.jd.com/cgi-bin/mm/domlogin url script-response-header https://raw.githubusercontent.com/id77/QuantumultX/master/Script/unHttpOnly.js
https://jdqd.jd.com/poststring url reject

# web切换jd cookie

^https?:\/\/.{0,27}\.?jd\.(com|hk)\/?((?!\.(js|json|jpg|gif|png|webp|dpg|flv|mp3|mp4)).)*$ url script-response-body https://raw.githubusercontent.com/id77/QuantumultX/master/Script/jd_hd.js
^https?:\/\/.*\.jingxi\.com\/?((?!\.(js|json|jpg|gif|png|flv|mp3|mp4)).)*$ url script-response-body https://raw.githubusercontent.com/id77/QuantumultX/master/Script/jd_hd.js

# 京东活动
https?://.*\.isvjcloud\.com url script-response-body https://raw.githubusercontent.com/id77/QuantumultX/master/Script/jd_hd.js
https?://.*\.moxigame\.cn url script-response-body https://raw.githubusercontent.com/id77/QuantumultX/master/Script/jd_hd.js

[mitm]
hostname = -lite-msg.m.jd.com, -jdcs.m.jd.com, -ddms.jd.com, -redpoint-msg.m.jd.com, -msjdpay.jd.com, -payfinish.jd.com, -payfinish.m.jd.com, *.jd.com, *.*.jd.com ,*.jd.hk, *.*.jd.hk, *.moxigame.cn
*/
const $ = new Env('京东助手', { noLog: true });
$.domain = $request.url.match(/https?:\/\/([^\/]+)/)[1];
$.domainWhitelist = ['jd.com', 'jd.hk', 'jingxi.com'];
$.isNeedToolsDomain = false;
$.seckill = false;

if ($request.url.includes('/seckill')) {
  // $.seckill = true;
}

let urlSku;
const skuCache = $.getData('id77_JDSkuId_Cache');
const msgOpts = JSON.parse($.getData('id77_JDMsgOpts_Cache') || '{}');
let urlMatchArr = [];
if ($request.url.includes('graphext/draw')) {
  urlMatchArr = $request.url.match(/sku=(\d+)/);
  appType = 'jdpingou';
} else if ($request.url.includes('wqsitem.jd.com/detail')) {
  urlMatchArr = $request.url.match(/wqsitem\.jd\.com\/detail\/(\d+)_/);
} else {
  urlMatchArr = $request.url.match(/\/.*\/(\d+)\.html/);
}
if (urlMatchArr?.length) {
  urlSku = urlMatchArr[1];
  // setTimeout(() => {}, 300);
}

$.domainWhitelist.forEach((item) => {
  if ($.domain.includes(item)) {
    $.isNeedToolsDomain = true;
  }
});

function randomInteger(min, max) {
  // now rand is from  (min-0.5) to (max+0.5)
  let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
}

let prefix = randomInteger(777, 7777);

let html = $response.body || '';

// console.log(`html:${html}`);
let modifiedHeaders = { ...$response.headers };
if (modifiedHeaders['Content-Security-Policy'])
  delete modifiedHeaders['Content-Security-Policy'];
if (modifiedHeaders['X-XSS-Protection'])
  delete modifiedHeaders['X-XSS-Protection'];

let key = 'Set-Cookie';
let cookies = $response.headers[key];
if (!cookies) {
  key = 'set-cookie';
  cookies = $response.headers[key];
}
if (cookies) {
  cookies = cookies
    .replace(/HttpOnly/gi, '')
    .replace(/(Expires=.+?),/gi, '$1@')
    .split(', ');

  let _key = key;
  cookies.forEach((ck, i) => {
    // 利用空格设置多个 set-cookie
    _key += ' ';
    modifiedHeaders[_key] = ck.replace(/@/g, ',');
  });
}

// 提前点亮
if (
  $request.url.includes('.com/coupons/show.action') &&
  /"status":\d+,"togo/.test(html)
) {
  html = html.replace(/"status":\d+,"togo/, '"status":999,"togo');
}
if ($request.url.includes('.com/mall/active/') && /,"status":"\d"/.test(html)) {
  html = html.replace(/,"status":"\d"/, ',"status":"0"');
}

if (!html.includes('</head>')) {
  $.done({ headers: modifiedHeaders });
}

try {
  let cookies = [];
  $.getData('CookieJD') && cookies.push($.getData('CookieJD'));
  $.getData('CookieJD2') && cookies.push($.getData('CookieJD2'));

  const extraCookies = JSON.parse($.getData('CookiesJD') || '[]').map(
    (item) => item.cookie
  );

  if ($.isNeedToolsDomain) {
    cookies = Array.from(new Set([...cookies, ...extraCookies]));
  }

  let url = $request.url.replace(/&un_area=[\d_]+/g, '');
  let sku;
  let arr = [];
  if (/sku=\d+/.test(url)) {
    arr = url.match(/sku=(\d+)/);
  }
  if (/wareId=\d+/.test(url)) {
    arr = url.match(/wareId=(\d+)/);
  }
  if (/\/product(?:[\/\w]+)?\/(\d+)\.html/.test(url)) {
    arr = url.match(/\/.*\/(\d+)\.html/);
  }

  sku = arr.length != 0 ? arr[1] : '';

  const vx77 =
    url.includes('getcoupon') &&
    html.includes('handleCard') &&
    html.includes('jssdk');

  let cookieListDom = `<ul class="cks">`;

  // const isJD = url.includes('jd.com') || url.includes('jingxi.com');
  if (cookies.length > 0) {
    for (let index = 0; index < cookies.length; index++) {
      const cookie = cookies[index];
      const pin = decodeURI(cookie.match(/pt_pin=(.+?);/)[1]);
      cookieListDom += `<li data-cookie-index="${
        index + 1
      }" id="_${pin}" class="_${prefix}_id77_cookieDom" onclick="_${prefix}_id77_changeCookie('${cookie}')">${pin}</li>`;
    }
  }
  cookieListDom += `</ul>`;

  let tools = ``;
  if (cookies.length > 0) {
    tools =
      `
    <div id="_${prefix}_id77_btns">
      <div id="cks" class="_${prefix}_id77_btn _${prefix}_id77_hide"></div>
      <div id="nextCookie" class="_${prefix}_id77_btn _${prefix}_id77_hide"></div>
      <div id="Foxok" class="_${prefix}_id77_btn _${prefix}_id77_hide" onclick="window.location.href='Foxok://url?${url}'">
        <img src="data:image/jpg;base64,_9j_4AAQSkZJRgABAQAAAQABAAD_2wBDAAMCAgMCAgMDAgMDAwMDBAcFBAQEBAkGBwUHCgkLCwoJCgoMDREODAwQDAoKDhQPEBESExMTCw4UFhQSFhESExL_2wBDAQMDAwQEBAgFBQgSDAoMEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhL_wgARCAAgACADAREAAhEBAxEB_8QAGQABAQADAQAAAAAAAAAAAAAABwYCBAUJ_8QAGwEBAAIDAQEAAAAAAAAAAAAABgUHAAMEAQL_2gAMAwEAAhADEAAAAPUrX9CwB93Mj1CwCEEWRBNeWLryGNioLny-j1ftatBA0s5wrj8SXil1VvhaZbFf_8QAKxAAAgEDAgUDAwUAAAAAAAAAAQIDBAURAAYHEhMhQQgUMRWBkRYjU3Fy_9oACAEBAAE_AKmpiooJJ6p1hhhUu7scBQPJ1evU5bI62Sn2rb5rtGhx7pn6UT_5-Sf7xjW1uOVPeZUivNvkoOfsJUfqJ9_I1DMs8QeFlZGAKsDkEa4q7jpbZDRWy7wJPa7v1Irgr_wkcpP5YHVbw_k2LKKOjt1FuC41DFqf3dQUgSDJEZ5R3lkfGcdgNbM4xWutqb9ZazaNsg3Ft2n91NCHeNHiEnJKMdyrISp8ghhrgnxHO9o7lRPbYbYbWUMccMzSKyNnywGO4OuOFjlrrNT10CFxQsRKAM4RvOqXcdO89qku9xFBWWX9tJanPSnhByoLjPJIh-Ccgj8iu2Lt_btmvFx25a7RBdt5AT19ZR0vJJOhYuWdj3JZiTr09bSls9DdbpVIU-oyqkAPmNM9_uSdSwR1MTxzqrxuMMpGQRq6-n-y118grIJ5oKRJhJNREBkkAOeUZ7ga_Q8VXWvPdZuurHtEowoHwBqKFKeJY4UCIigKq9gANf_EACMRAAIBBAICAgMAAAAAAAAAAAIDAQAEERIFBjFhEyEyQVH_2gAIAQIBAT8AacKDaZ-orku_ISz40Dt7rje-JeWrR190toNiJCcxXY-TVbmtDPxPOafxVrZOwQ7kfj1TEWltbkw7fJD7rqPNjerJYL11913mwY1AvH71pN4NzKxNmph4nHmuw35ospURbGddB41iLcmsjG1MWDQmJjMTTek203cOCcR_KLqKHXcveW0_qKUqFBgY8V__xAAjEQABAwMEAwEBAAAAAAAAAAACAAEDBAUSBhEhMRMiQUJh_9oACAEDAQE_AAjczYBbdUOgqmSLyTlhv8Vw0jLTs_jLJOOD4krDQyTZzRv7Bs7KC9lc-ZJPGA98fVddPzxvEYVWUcnT7MtU2B7Y4k55MS0lWRRVJRSPwSqLcYNJ4AyA-_4rfWzz1QRyl6x9LWlzaolCFvygNwLce2VPrGsjpShfl3-oboYhsHDoycn3J-V__9k" />
      </div>` +
      (!sku
        ? ``
        : `<button id="smzdm" class="_${prefix}_id77_btn _${prefix}_id77_hide"></button><button id="manmanbuy" class="_${prefix}_id77_btn _${prefix}_id77_hide"></button>`) +
      (skuCache === urlSku && msgOpts.openUrl
        ? `<div id="JF" class="_${prefix}_id77_btn _${prefix}_id77_hide"></div>`
        : ``) +
      `<div id="open_url" class="_${prefix}_id77_btn _${prefix}_id77_hide"></div></div>`;
  }

  let copyObject = `<script ignore>
    // 复制一份
    if(window.localStorage) {
      window.localStorageCopy = window.localStorage
    }
    if(window.sessionStorage) {
      window.sessionStorageCopy = window.sessionStorage
    }
    const _${prefix}_id77_Map = Map;
  </script>`;

  let mitmFuckEid = `<script ignore>
   function _${prefix}_id77_upsetArr(arr){
      return arr.sort(function(){ return Math.random() - 0.5});
    }

    // 极速版反跟踪phone
    const Storage_setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      // if (this === window.localStorage) {
      //      // do what you want if setItem is called on localStorage
      //     Storage_setItem.apply(this, [key, value]);
      // } else {

      if (key === 'appEid') {
        let appEid = value.slice(5);
        if (appEid) {
          Storage_setItem.apply(this, [
            key,
            'eidif' + _${prefix}_id77_upsetArr(appEid.split('')).join(''),
          ]);
        }
      } else {
        Storage_setItem.apply(this, [key, value]);
      }
      // }
    };
  </script>`;

  let scriptDoms = `<script src="https://unpkg.com/vconsole@3.14.6/dist/vconsole.min.js" ignore></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.1/js.cookie.min.js" ignore></script>`;

  if (vx77) {
    html = html.replace(
      '{initJSSDK(initPage)},200);',
      '{initJSSDK(initPage)},0);'
    );
  }

  let mitmFixContent = `<script ignore>
    
    if (
      ${vx77}
    ) {
      setTimeout(() => {
        if (window.handleCard) handleCard();
      }, 1);
    }

    if (Map !== _${prefix}_id77_Map) {
      // 兼容保价页面
      if(!Map.prototype.set &&((Map.toString && Map.toString()) || '').includes('this.elements')){
        Map.prototype.set = function(_key, _value) { 
          if (this.containsKey(_key) == true) {  
            if (this.remove(_key) == true) { 
                this.elements.push({ 
                  key : _key, 
                  value : _value 
                }); 

            } else { 
              this.elements.push({ 
                key : _key, 
                value : _value 
              }); 
            } 
          } else { 
            this.elements.push({ 
              key : _key, 
              value : _value 
            }); 
          } 
        }
        Map.prototype.has = function(_key) { 
          var bln = false; 
          try { 
            for (i = 0; i < this.elements.length; i++) {  
              if (this.elements[i].key == _key){ 
                bln = true; 
              } 
            } 
          } catch (e) { 
            bln = false;  
          } 
          return bln; 
        }
      }
    }
  </script>`;

  let mitmContent = `<style>`;
  if (vx77) {
    mitmContent += `
      #cardBtn {
        width: 100%;
        height: 7.7rem;
      }
    `;
  }
  mitmContent += `
    body > a {
        display: inline-block !important;
    }
    .vc-tab._${prefix}_id77_hide {
      display: none !important;
    }
    * {
      -webkit-user-select: auto !important;
      user-select: auto !important;
    }
    #alook {
      bottom: 17.8571em;
    }
    #Foxok {
      top: 18.7571em;
    }
    #smzdm {
      top: 21.7571em;
      font-size: inherit;
      background: url(data:image/jpg;base64,_9j_4AAQSkZJRgABAQAAAQABAAD_2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT_2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT_wgARCAAgACADAREAAhEBAxEB_8QAFwABAQEBAAAAAAAAAAAAAAAACAYHBP_EABkBAQEAAwEAAAAAAAAAAAAAAAYHAgQFCP_aAAwDAQACEAMQAAAAbhyjFAZe6zeO7wplhtF2mr7Ryy6BcokbrS5cxTsoXzZZGc1YlooiBvP1rLdBi2GXnb__xAAqEAACAgEEAQMDBAMAAAAAAAABAwIEBQYHERIACBMhIjEyFBVBYSNCVP_aAAgBAQABPwDf3f0bbQhg8HBN3VVtYlCLvlVSM5dYTmAR2JPPWPI56kkgDzc_Iavo6u_Qbg5fIVrMp152DctiaVIazqHQXCQUQAGcAAGXtmPmc233N2m1llEaOvZ_JUsWiFpuSogoqiMgZShNTZlbJCMeT1jI8SHHnpv9SKt2knCZgIqanrJ98FHwm-rkAtWD-JHI7Q5PHYEEjzAKuby78om2ZZ-4ZmWQez-FUkMExyCfxC4JWf7n5kNUZ_VHqn1NgEP07idQvcytTfmcVC9YrJSmE1qSe_wGQ7t-xjzIg-b11qevNN7lXbztXUL2Iw8stQx13ILTTMIr_wCVMyevdfMhYHY9z180Xq52iNe4LO1pyjPHZBTpSB-6u3Ro_vlUmDzXORyu1TdxNLJrwqvm1tazbJl70qUOzVph_rGLIyXKchyZD6PsORns7NGrM7fdVXcZRlpnUiSFAtVGwyVS0QQO3WKlGXHz5pfSScTn9Rvx-mnDHZOtdoTbjcDXw9CKzI9J2WWWB1mfMeAyI6_XIiPBEjP055jA6o0NgLmfwGYvZu4moyph7vvPSuHEnMkCBzELhM9_jiRiCPPUr6aVbw0zlsPNNTU6UFBDeYqvp-f8TJD5jIcnrP569iCCPNbbubwaFtVYXcZc0ffRilYe3fhRDI3YqlIraGGElQmO0-BCcvyJPiMBr_enJELpai1nZZI8ttlr0gk8n62kJgOfngGIH8Dz0velpGyqn5vMfpbWq7i_bIqQARRUeCVrPAMpHgdp8Dz_xAApEQABAgQEBQUBAAAAAAAAAAABAhEAAwQhBTFBYRJRgZGhExQiceFC_9oACAECAQE_AMUxUUTSpQdZ8aOd-QiqNV6_pVqiMszZicwAWtfeF0VdQzVCnUopTdxbTUEsfLxheJ-9HAsMsX2I2iQleI4hxaFTn6H4AOsGZOmYjMl_FKjk4chhYD7F4rQmplzeMqBSlwHAHYfX9dIplmRORMByIPm_cOOsTCujVOp02JJD6tmBbmGJ57RMWRNUsh24FDZ_ifESpQQpRSixcWSEjZ3Lk75QMOVLmS5ZUkkkBgb79GEYnhgrWWgssdiIm1VdJUHTwFgCWzbK9xrzgS6msVkpXc_g7iMOw4UnzXdR7CP_xAAtEQACAgEEAgECAwkAAAAAAAABAgMRBAUGEiEAMUEUQhMiYRUyQ1FScYGRov_aAAgBAwEBPwDae0_23eZmErjoe69sR2Qp7qh7PdWAB5ocWlzYX4-hwqygNVKQxZVviSRz98bskDlfmLrWgbgwY21VI0eQlQjfmaxQBDKoZQSerI7B83js86A31WLbY7Gu_aH4Vj839rdXRBHmWYdubbYL1wj4AfzkcV1XyWLOP0HkWFh4W0MbNdZZIQAWEchjVmZiCzdGyppPYNAHtfNuSSaXlafFCsLpLII3ZUJeyw_iOtXTdGI15qeAmp6dPiSC-aMP81a_9AHzTIsbX10_UXbkAFYL1XM0rMfklCGCg0B-95j4wbDhhRuPP6qE99HgBJH-llmq_M3PfIxoEnyBzjMbANK8r3XYQRqUjWvak8hQHLw7wxsrGzcyOCSNYlZgXWlJPSgEejyI_L8izfmzd5vt1vp8kFoCb69o39Sg9G_uXq6BB80zQNsamjGKQToXMiryrjyAteNhyDQvko9ADx8rRtuxdtHAB8DiG_0oLn-5vzeW9JNxkYuPYx1N9-3PwW90B9q91ZJ8_9k) #FFF no-repeat 0.3571em/1.64em;
    }
    #manmanbuy {
      top: 24.7571em;
      font-size: inherit;
      background: url(data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABCFBMVEX_UQAAAAD_UQD_UQD_UQD_UQD_UQD_UgD_UAD_UQD_UAD_UQD_UAD_UQD_______3_SQD_AAD_pJP_6OH_rqD__vr_VRf__Pj_-fT_q5z_WSL_Vhr_Wir_WCD_VA__Uw3_RgD_WSb_TgD_2ND_tKf_VBL_-fb_3tb_29P_x77_Ugf_UQT_TAD_8uz_7eb_493_0sr_WQD_UwD_MgD_9vH_kHz_1Mz_tqr_saT_opH_n43_lID_Yzv_OgD_9O__8On_xLn_ppf_l4T_gWn_zcX_m4n_i3f_Xi7_EAD_6uL_wLX_QQD_LAD_JgD_HwD_ysH_vrD_hHD_dlf_bk__GQD_e2L_eVz_Xzw_Og6BAAAADXRSTlP6APn84NmsenVxa7GlwfBNewAAAkhJREFUOMt9k-eWmzAQhcHZnnhkGTBgMKaazmID7r1u70ne_02CYZ2zdrJ7daQ_853R0ehegiQvjgvEf1U4PidJgvzRbBU_Uat5QhIXzcK3z4BvheYZcdzK665UT09JqueSJMlNidYRQWRV11VLnlGUSh-kbitEDhiCY2xc2blVxGotkyiKxrZS2AJucTTCPOev8JSbcGxjq7HP9R_EvIPh1aZmwiPQMYWQvRgkyXo-ZoG_EtUMEErKBPQeiv2FxXCUZm1XzKHZ1XuHSqlGAV9GXPBisZw5fbRt-9GPmQ9AlQK6zCAeBwBauUvTtM4C8HgfQKiDp2ZoXmZqa-HvW-EA0B8G8_4qGazmyaC3mg8Ur753Bcx6wPg-YoIYNQIOxkNZ2AfKOjDJGmK1AybW0PXmEJjRgJ4XEEddsLAGwb8dOoCCABA1BvaSg4lS2gMQol_5Ps_3-_ys36PL5YVcP3wFvlnay3YYhu3QtpeD0eEzux4D4GumZVkmQjDFH0edD6rNcBq-f4vwT3bMrqPqDlAo4DPgucGyXayMFIpF4Z1QfAc86Xr7m0iP5DKLWFtZXzNgioKxc5Rxmzz94hmk4wi_mhyTmsbvYHynOjvL1aN7rCPovjzZbQoYxKCGFt7woiftPFkb3vEx26OB4y6X3cX8pj1psH8nmUmtDoc1YVORo7eHUXR1P1KVjfNu2kyuJ8uqJ5fUilKtCErN8UpybvtdcBzDcBxDcoppHNLtptHJg3P-dfROCfLkq_B-J9P4nx19Fv-jU5L8AxY-aPN-AHdYAAAAAElFTkSuQmCC) #FFF no-repeat 0.3571em/1.64em;
    }
    #cks {
      top: 12.7571em;
      background: url(data:image/jpg;base64,_9j_4AAQSkZJRgABAQAAAQABAAD_2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL_2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL_wgARCAAgACADAREAAhEBAxEB_8QAGAABAAMBAAAAAAAAAAAAAAAABgMEBQf_xAAYAQACAwAAAAAAAAAAAAAAAAAAAQIDBP_aAAwDAQACEAMQAAAA70kHry61mlK3QAeEMdad0aLhYDisN6V5n8qYQMK_fI__xAApEAABBAECBgIBBQAAAAAAAAABAgMEEQUAEgYTITFBYVGhBxUycYGx_9oACAEBAAE_AFhRbVtISqjRI6A6c_UpW9h3iXnMlw7ncdFpbdD9m4EivsaHEUDD46G9MlJaxbhS23OmPlJWTdXY-yQK0khQsGxp9pMuQWHOsdtAUtHhZN0D6AF17GuHOJcdNy7_AAs_gX4hhRErdelISGl9gfZBPY6y2djLvAHBMT4zK0coSyC1trcixRKdoA6kdinXCWXTl8MFUEuMLLLgHYEdRXqiNNrU1PlhVVtS4P4qv9B04GFo3uICwn5TZGvyjgH8vmZWOx2wvyOQ8gFzYCqlpUFKJqilGvw-y_FwDsCTGXFfi7Glsr-RYKh4IOpTClqQ6wQl9u9pV2UD3SfR-iBpt5xguW08kUNrWwqAPmlJvp_XTXEmEn5h9mdjUVMA5S0P2hsouwSqgenwAbsg6wGEGHYWXHefLeovO9gSPCR4SLOv_8QAGBEAAwEBAAAAAAAAAAAAAAAAAAEQAhH_2gAIAQIBAT8AmbwehOsVYj__xAAdEQABBAMBAQAAAAAAAAAAAAABAAIDEhARUUFh_9oACAEDAQE_AHBx9ToXn1MFQgdrTVVqjhsE9lDmI2gI4pQRGPuYJqgjqfLfQ4v_2Q) #FFF no-repeat 0.3571em/1.64em;
    }
    #nextCookie {
      top: 15.7571em;
      background: url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cGF0aCBmaWxsPSIjMjQ4NmZmIiBkPSJNMTQ1LjY1OSw2OC45NDljLTUuMTAxLTUuMjA4LTEzLjM3Mi01LjIwOC0xOC40NzMsMEw5OS40NzksOTcuMjMzIEw3MS43NzIsNjguOTQ5Yy01LjEtNS4yMDgtMTMuMzcxLTUuMjA4LTE4LjQ3MywwYy01LjA5OSw1LjIwOC01LjA5OSwxMy42NDgsMCwxOC44NTdsNDYuMTgsNDcuMTRsNDYuMTgxLTQ3LjE0IEMxNTAuNzU5LDgyLjU5OCwxNTAuNzU5LDc0LjE1NywxNDUuNjU5LDY4Ljk0OXoiLz48L3N2Zz4NCg==) #FFF no-repeat 0.291em/1.74em;
    }
    #JF {
      top: 27.7571em;
      background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjcxODU5NjIwMjI5IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjI3NTciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik00OTggNDU0LjRjLTAuMiA0OC41LTEuOCA5Mi40LTQuNiAxMzEuMWw0LjItMS4xYzE5LjUtNS4zIDM3LjEtMTIuMyA1Mi42LTIwLjktMjQuNS0yOS44LTQwLjgtNjYuNC00OC4zLTEwOS4xbC0xLjctOS40SDQ5OHY5LjR6IiBwLWlkPSIyNzU4IiBmaWxsPSIjMTI5NmRiIj48L3BhdGg+PHBhdGggZD0iTTg0NC40IDM0Ny45Yy0xOTAuNiAyMC41LTIzNy4zIDIxLjItMzQ2LjQgMjYuOHYxNC45aDEzNC44YzM2LjggNC4xIDU2LjQgMjYuMyA1Ni43IDY0LjN2MC44Yy0yIDIyLjYtOC42IDQ0LjUtMTkuNyA2NC45LTcuNCAxNS41LTE2LjcgMzAtMjcuNiA0My4yIDE3LjIgOC44IDM2LjkgMTYgNTguNyAyMS42bDYgMS41djYzbC05LjgtMi4yYy0zOS4zLTguOC03My4xLTIyLjgtMTAwLjYtNDEuNi02NyAzMy4zLTEwOC42IDM1LjQtMTA4LjYgMzUuNGgtMzkuMmMyNC40IDkuOSA2NS4yIDE1LjYgMTIxLjcgMTcgNjIuNCAwIDEwOC43LTEuMSAxMzcuNS0zLjJsOC41LTAuNiAwLjYgNTYuNi02LjYgMS4yYy0xNS40IDIuOS02NC45IDQuMy0xNTEuNiA0LjNoLTAuMmMtODQtMS43LTE0MC40LTE2LTE3MS45LTQzLjYtMTMuOCAxOC45LTM3LjEgMzMuMi02OS40IDQyLjhsLTEwLjMgM3YtNTkuNWw0LjQtMi4yYzI5LjUtMTUgNDYtMzQuOSA1MC43LTYwLjZ2LTgyLjhjMC0yLjQgMC03LjgtMTAuOS0xMi4yaC00Mi43bC0wLjctNTQuMWg1My44bDAuNyAwLjFjMzMuMiA1LjcgNTMuMSAyNi4yIDU3LjUgNTkuMWwwLjEgMC41VjYwNmMwIDEwLjEgMi40IDE3LjcgNy41IDIzLjIgNy42LTM3LjQgMTEuNC05Ni40IDExLjQtMTc1LjZWMzE2LjJoOGMxMjMuMy0yLjYgMjY5LjctMjAuNyAzNjcuNC0zOC42IDI5LjEtNi40IDUwLjctMTEuNCA2OS4yLTE2LjNDODAyLjkgMTQyLjMgNjY2LjYgNjQgNTEyIDY0IDI2NC42IDY0IDY0IDI2NC42IDY0IDUxMnMyMDAuNiA0NDggNDQ4IDQ0OCA0NDgtMjAwLjYgNDQ4LTQ0OGMwLTYyLjgtMTIuOS0xMjIuNS0zNi4yLTE3Ni44LTI3IDQuOS01NiAxMC4yLTc5LjQgMTIuN3ogbS01MzMuNy0yNS44bDkuOSAyLjRjNDEuOSAxMCA3NC41IDI1LjggOTYuOCA0Ni45bDIuNSAyLjR2NzMuN2wtMTMuNy0xNC4yQzM4NyA0MTMuNSAzNTYuNiAzOTYgMzE2IDM4MS4xbC01LjMtMS45di01Ny4xeiIgcC1pZD0iMjc1OSIgZmlsbD0iIzEyOTZkYiI+PC9wYXRoPjxwYXRoIGQ9Ik02MjYuNiA0NjAuMWMtMC41LTkuNy00LjktMTQuMi0xNS4zLTE1LjFINTU4bDEgNi45YzQuMiAyOS45IDE2IDU1LjEgMzUuMSA3NS4yIDIxLjUtMjYuNSAzMi40LTQ5IDMyLjUtNjd6IiBwLWlkPSIyNzYwIiBmaWxsPSIjMTI5NmRiIj48L3BhdGg+PC9zdmc+) #FFF no-repeat 0.3571em/1.88em;
    }
    #open_url {
      top: 37.7571em;
      background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjcyMDI0OTU1NzcxIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9Ijk0ODkiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiPjxwYXRoIGQ9Ik02NjQuNTc2IDg5Ni40MjY2NjdsMTA4LjU4NjY2Ny0xMDguNTg2NjY3aC0zMDEuMDEzMzM0di01OS43MzMzMzNoMzAxLjY1MzMzNGwtMTA5LjIyNjY2Ny0xMDkuMjI2NjY3IDQyLjI0LTQyLjI0IDE4MC45OTIgMTgxLjAzNDY2N0w3MDYuODE2IDkzOC42NjY2Njd6TTQ3MS44OTMzMzMgOTM4LjY2NjY2N0gyMDAuMTQ5MzMzYTYzLjYxNiA2My42MTYgMCAwIDEtMjQuOTE3MzMzLTUuMDM0NjY3IDY0IDY0IDAgMCAxLTEwLjg4LTUuODg4IDY0LjI5ODY2NyA2NC4yOTg2NjcgMCAwIDEtOS40NzItNy44MDggNjQuODk2IDY0Ljg5NiAwIDAgMS03LjgwOC05LjQ3MiA2NCA2NCAwIDAgMS01Ljg4OC0xMC44OCA2My42NTg2NjcgNjMuNjU4NjY3IDAgMCAxLTUuMDM0NjY3LTI0LjkxNzMzM3YtNzI1LjMzMzMzNGE2My42NTg2NjcgNjMuNjU4NjY3IDAgMCAxIDUuMDM0NjY3LTI0LjkxNzMzMyA2NCA2NCAwIDAgMSA1Ljg4OC0xMC44OCA2NC4zODQgNjQuMzg0IDAgMCAxIDcuODA4LTkuNDcyIDY0IDY0IDAgMCAxIDkuNDcyLTcuODA4IDY0IDY0IDAgMCAxIDEwLjg4LTUuODg4QTYzLjYxNiA2My42MTYgMCAwIDEgMjAwLjE0OTMzMyA4NS4zMzMzMzNoNDA1LjMzMzMzNGwyMTMuMzMzMzMzIDIxMy4zMzMzMzR2MjM0LjY2NjY2NmgtNTkuNzMzMzMzVjM4NGgtMjM4LjkzMzMzNFYxNDUuMDY2NjY3aC0zMjQuMjY2NjY2djczMy44NjY2NjZoMjc2LjAxMDY2NlY5MzguNjY2NjY3eiBtMTA3Ljk4OTMzNC02MTQuNGgxNzkuMnYtMC43NjhsLTE3OS4yLTE3OS4yIDAuNzY4IDAuNzY4aC0wLjc2OHoiIHAtaWQ9Ijk0OTAiIGZpbGw9IiMxMjk2ZGIiPjwvcGF0aD48L3N2Zz4=) #FFF no-repeat 0.3571em/1.88em;
    }
    .vc-panel {
      z-index: 100000 !important;
    }
    ._${prefix}_id77_btn {
      position: fixed;
      right: 0;
      z-index: 99999;
      box-sizing: content-box;
      width: 1.14em;
      height: 2.1429em;
      padding: 0 1.4286em 0 0;
      border: 1px solid rgba(255,255,255,0.8);
      background: #FFF;
      border-radius: 50px 0 0 50px;
      background-size: 80%;
      overflow: hidden;
    }
    ._${prefix}_id77_btn img {
      box-sizing: content-box;
      max-width: 2.1429em !important;
      width: 2.1429em !important;
      height: 2.1429em !important;
      border: 1px solid rgba(255,255,255,0.8);
      background: #FFF;
      border-radius: 50px 0 0 50px;
    }
    .cks {
      padding: 1.1429em;
      list-style-type: decimal-leading-zero !important;
      margin-left: 2em;
    }
    .cks li {
      list-style-type: decimal-leading-zero !important;
      margin-bottom: 0.7143em;
      border: 0.0714em solid #ccc;
      padding: 0.3571em;
    }
    #_${prefix}_id77_btns { 
      font-size: 14px;
    }
    ._${prefix}_id77_btn._${prefix}_id77_hide {
      display: none !important;
    }
  </style>
  <script ignore>
    const _${prefix}_id77_cookies_tool = Cookies;
    const _${prefix}_id77_domain = window.location.origin;
    const _${prefix}_id77_currentPin = _${prefix}_id77_cookies_tool.get('pt_pin');
    const _${prefix}_id77_currentKey = _${prefix}_id77_cookies_tool.get('pt_key');
    const _${prefix}_id77_needHideSwitch = localStorage.getItem('vConsole_switch_hide') === 'Y';
    const _${prefix}_id77_btnsDom = \`${tools}\`;

    const _${prefix}_id77_cookies = ${JSON.stringify(cookies)};

    // ck同步最新
    if(_${prefix}_id77_currentPin && !"${url}".includes('/login')) {
      // console.log('_${prefix}_id77_currentPin', encodeURI(_${prefix}_id77_currentPin));
      for (const ck of _${prefix}_id77_cookies) {
        const _pin = ck.match(/pt_pin=(.+?);/)[1];
        const _key = ck.match(/pt_key=(.+?);/)[1];
        // console.log('_pin', _pin);
        
        if(_${prefix}_id77_currentKey && _pin === encodeURI(_${prefix}_id77_currentPin) && _key !== _${prefix}_id77_currentKey) {
          _${prefix}_id77_setCookie(ck);
          console.log('已同步 cookie');
        }
      }
    }

    function _${prefix}_id77_clearData() {
      sessionStorage.clear();
      localStorage.clear();

      const domains = [_${prefix}_id77_domain.match(/.*?([^\/]+\.[^.]+)\$/)?.[1]??'', _${prefix}_id77_domain.match(/[^.]+\.(com.cn|net.cn|org.cn|gov.cn|edu.cn)$/)?.[0] || (_${prefix}_id77_domain.match(/.*?([^\.]+.[^.]+)\$/)?.[1]??'')];

      Object.keys(_${prefix}_id77_cookies_tool.get()).forEach(function (cookieName) {
        _${prefix}_id77_cookies_tool.remove(cookieName, {
          expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
        });
        _${prefix}_id77_cookies_tool.remove(cookieName, {
          path: '/',
          expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
        });
        for (let j = domains.length - 1; j >= 0; j--) {
          _${prefix}_id77_cookies_tool.remove(cookieName, {
            domain: '.' + domains[j],
            path: '/',
            expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
          });
        }
      });

    }
    
    function _${prefix}_id77_setCookie(cookie) {

      const domain = _${prefix}_id77_domain.match(/[^.]+\.(com.cn|net.cn|org.cn|gov.cn|edu.cn)\$/)?.[0] || (_${prefix}_id77_domain.match(/.*?([^\.]+.[^.]+)\$/)?.[1]??'');

      const other = { 
        path: '/',
        expires: 8/24,
        // SameSite: 'Strict',
        // secure: true
        domain
      };
      
      _${prefix}_id77_cookies_tool.set('pt_key', cookie.match(/pt_key=(.+?);/)[1], other);
      _${prefix}_id77_cookies_tool.set('pt_pin', decodeURI(cookie.match(/pt_pin=(.+?);/)[1]), other);

    }

    function _${prefix}_id77_changeCookie(cookie){
      _${prefix}_id77_clearData();
      _${prefix}_id77_setCookie(cookie);
      window.location.reload();
    }

    function _${prefix}_id77_nextCookie() {
      const cookieDomList = document.querySelectorAll("._${prefix}_id77_cookieDom"); 
      const cookieDom = document.querySelector("#_" + _${prefix}_id77_currentPin);

      const index = [].indexOf.call(cookieDomList, cookieDom);

      _${prefix}_id77_changeCookie(_${prefix}_id77_cookies[index + 1]);
    }

    // const _script = document.createElement('script');
    // _script.src = "https://unpkg.com/vconsole@3.12.0/dist/vconsole.min.js";
    // // _script.src = "https://unpkg.com/vconsole@latest/dist/vconsole.min.js";
    // // _script.doneState = { loaded: true, complete: true};
    // _script.onload = function() {
      
    // };

    _${prefix}_id77_onReady(_${prefix}_id77_init);

    function _${prefix}_id77_onReady(fn){
      try {
        const readyState = document.readyState;
        if(readyState === 'interactive' || readyState === 'complete') {
          fn()
        }else{
          window.addEventListener("DOMContentLoaded",fn);
        }
        
      } catch (error) {
        console.error(arguments.callee.name, error);
      }
    }

    function _${prefix}_id77_changeBtns() {
      const \$btns = document.querySelectorAll('._${prefix}_id77_btn');
      Array.prototype.forEach.call(\$btns, function(el, i){
        if (el.classList.contains('_${prefix}_id77_hide')){
          el.classList.remove('_${prefix}_id77_hide');
        } else {
          el.classList.add('_${prefix}_id77_hide');
        }
      });
    }

    function _${prefix}_id77_changeTabs() {
      const \$tabs = document.querySelectorAll('.vc-tab');
      Array.prototype.forEach.call(\$tabs, function(el, i){
        if (i === 0 || i === 2 || i > 3) return;
        if (el.classList.contains('_${prefix}_id77_hide')){
          el.classList.remove('_${prefix}_id77_hide');
        } else {
          el.classList.add('_${prefix}_id77_hide');
        }
      });
    }

    function _${prefix}_id77_changeMitmUI() {
      const vcSwitch = document.querySelector('.vc-switch');
      if (vcSwitch.style.display == 'none') {
         _${prefix}_id77_vConsole.showSwitch();
        localStorage.setItem('vConsole_switch_hide', 'N')
      } else {
         _${prefix}_id77_vConsole.hideSwitch();
        localStorage.setItem('vConsole_switch_hide', 'Y')
      }

      if (_${prefix}_id77_cookies.length > 0) _${prefix}_id77_changeBtns();
    }
    
    document.addEventListener('dblclick', function (e) {
      _${prefix}_id77_changeMitmUI();
    });
    
    function _${prefix}_id77_init () {
      document.querySelector('body').insertAdjacentHTML('beforeend', _${prefix}_id77_btnsDom);

      const _${prefix}_id77_btnIDs = [
        'smzdm',
        'manmanbuy',
      ];
      
      if (_${prefix}_id77_btnIDs.length > 0) {
        for (const _btnID of _${prefix}_id77_btnIDs) {
          const _btn = document.querySelector('#' + _btnID);

          if (_btn) {
            _btn.addEventListener('click',() => {
              _${prefix}_id77_copyText('https://item.jd.com/${sku}.html?' + Math.random());
              window.location.href= _btnID + '://';
            })
          }
        }
      }

      try {

        if(!window.localStorage) {
          window.localStorage = window.localStorageCopy
        }
        if(!window.sessionStorage) {
          window.sessionStorage = window.sessionStorageCopy
        }

        // 券链接 展示
        __showCouponLink = false;
        function showCouponLink() {
           if (__showCouponLink) return;
           const \$jdCouponDoms = document.querySelectorAll('div[roleid]');
            if (\$jdCouponDoms.length > 0) {
              Array.prototype.forEach.call(\$jdCouponDoms, function(el, i){
                  el.insertAdjacentElement('afterend', createDom('https://coupon.m.jd.com/coupons/show.action?key='+ el.getAttribute("key") + '&roleId=' + el.getAttribute("roleid")));
              });
              __showCouponLink = true;
            }

            const \$jdlifeCouponDoms = document.querySelectorAll('.prodFavorableInfo-wrap-couponitem');
            if (\$jdlifeCouponDoms.length > 0) {
              Array.prototype.forEach.call(\$jdlifeCouponDoms, function(el, i){
                  const \$dom = el.querySelector('div[data-roleid]')
                  if (\$dom)
                    el.insertAdjacentElement('afterend', createDom('https://coupon.m.jd.com/coupons/show.action?key='+ \$dom.getAttribute("data-encryptedkey") + '&roleId=' + \$dom.getAttribute("data-roleid")));
              });
              __showCouponLink = true;
            }
        }

        showCouponLink();

        document.addEventListener('click', (e) => {
            showCouponLink();
        })

        const \$fPromoComb = document.querySelector('#fPromoComb');
        if (\$fPromoComb) {
           \$fPromoComb.addEventListener('click', (e) => {
            const \$jxCouponDoms = document.querySelectorAll('.jxcoupon-item');
            if (\$jxCouponDoms.length > 0 && window._ITEM_DATA && _ITEM_DATA.floors) {
              const couponInfo = _ITEM_DATA.floors.filter(o => o.fId === 'fPromoComb')[0].fData.coupon.couponInfo;
              Array.prototype.forEach.call(\$jxCouponDoms, function(el, i){
                  el.insertAdjacentElement('afterend', createDom('https://coupon.m.jd.com/coupons/show.action?key='+ couponInfo[i].encryptedKey + '&roleId=' + couponInfo[i].roleId));
              });
              __showCouponLink = true;
            }
          })
        }
        const  _${prefix}_id77_vConsoleOptions = {
          onReady: () => {
            setTimeout(() => {
              console.log("初始化成功");
              console.info(window.location.href);
              if (${$.seckill}) {
                console.log('#seckill');
                let \$seckillSubDom;
                setInterval(() => { 
                  if (!\$seckillSubDom) \$seckillSubDom = document.querySelector('button.submit-btn');
                  if(\$seckillSubDom) {
                    \$seckillSubDom.click();
                    console.count('seckill');
                  }
                }, 600);
              }

            },3000);
          }
        }

        Map = _${prefix}_id77_Map;
        window._${prefix}_id77_vConsole = new VConsole(_${prefix}_id77_vConsoleOptions);
        if (_${prefix}_id77_needHideSwitch) {
           _${prefix}_id77_vConsole.hideSwitch(); 
        }
  
        const JDCKPlugin = new VConsole.VConsolePlugin("jd_cookie", "京东CK");

        JDCKPlugin.on('renderTab', function (callback) {
          const html = \`
                        ${cookieListDom}
                      \`;

          callback(html);
        });
        
        JDCKPlugin.on("addTool", function (callback) {
         
          const toolList = [];
          toolList.push({
            name: "显隐图标",
            global: false,
            onClick: function (event) {
              _${prefix}_id77_vConsole.hide();
              _${prefix}_id77_changeBtns();
            },
          });
  
          toolList.push({
            name: "其他工具",
            global: true,
            onClick: function (event) {
              _${prefix}_id77_changeTabs();
            },
          });

          window._${prefix}_id77_submit = null;
          toolList.push({
            name: "抢",
            global: true,
            onClick: function (event) {
              if (!window._${prefix}_id77_submit) {
                window._${prefix}_id77_submit = setInterval(() => {
                  let dom = document.querySelector('.confirm-button');
                  if (!dom) {
                    dom = document.querySelector('button.submit-btn');
                  }
                  if (!dom) {
                    dom = document.querySelector('.free_coupon a.coupon');
                    document.querySelector('.free_coupon').click();
                  }
                  dom.click();
                  //document.querySelector('.coupon-btns .btn').click();
                }, 600);
                _${prefix}_id77_vConsole.hide();
              } else {
                clearInterval(window._${prefix}_id77_submit);
              }
            },
          });
  
          const cksDom = document.querySelector('#cks');
          cksDom.addEventListener('click', (e) => {
             _${prefix}_id77_vConsole.show();
             _${prefix}_id77_vConsole.showPlugin("jd_cookie");
            e.stopPropagation();
          })
          cksDom.addEventListener('dblclick', function (e) {
            _${prefix}_id77_changeCookie(_${prefix}_id77_cookies[0]);
            e.stopPropagation();
          });
  
          const nextCookieDom = document.querySelector('#nextCookie');
          nextCookieDom.addEventListener('click', (e) => {
            _${prefix}_id77_nextCookie();
            e.stopPropagation();
          })

          const JFDom = document.querySelector('#JF');
          if (JFDom) {
            JFDom.addEventListener('click', (e) => {
              const url = '${msgOpts.openUrl}';
              _${prefix}_id77_copyText(url);
              console.log(url);
              const aDom = document.createElement('a');
              aDom.setAttribute('href', url);
              aDom.click();
              e.stopPropagation();
            });
          }

          const openUrlDom = document.querySelector('#open_url');
          if (openUrlDom) {
            openUrlDom.addEventListener('click', async (e) => {
              try {  
                const url = await navigator.clipboard.readText();
                if (url.includes('https://')) {
                  console.log(url);
                  const aDom = document.createElement('a');
                  aDom.setAttribute('href', url);
                  aDom.click();
                  e.stopPropagation();
                }
              } catch (error) {
                console.log(error);
              }
            });
          }

          // console.log('${skuCache} @ ${urlSku} @ ${msgOpts?.openUrl}')

          callback(toolList);
        });
        
        JDCKPlugin.on('ready', function() {
          if (!_${prefix}_id77_needHideSwitch) {
            const \$btns = document.querySelectorAll('._${prefix}_id77_btn');
            Array.prototype.forEach.call(\$btns, function(el, i){
              el.classList.remove('_${prefix}_id77_hide');
            });
          }
  
          const fontSize = document.querySelector('#__vconsole').style.fontSize;
  
          if(fontSize) {
            document.querySelector('#_${prefix}_id77_btns').style.fontSize = fontSize;
          }
  
          const _currentCKDom = document.querySelector("#_" + _${prefix}_id77_currentPin);
  
          if (_${prefix}_id77_currentPin && _currentCKDom) {
            setTimeout(() => {
              _currentCKDom.style.background = '#238636';
            });
          }
          
        });
  
        function scrollTopToCKDom(reset) {
          const fontSize = document.querySelector('#__vconsole').style.fontSize;
  
          const _currentCKDom = document.querySelector("#_" + _${prefix}_id77_currentPin);
          const _VCcontext = document.querySelector('.vc-content');
  
          if (reset) {
            _VCcontext.scrollTop = 0;
            return;
          }
  
          let cookieIndex;
  
          if (_currentCKDom) {
            cookieIndex = _currentCKDom.dataset.cookieIndex - 1;
  
            if(_VCcontext && cookieIndex) {
              setTimeout(() => {
                _VCcontext.scrollTop  = cookieIndex * (fontSize || 16) * 2.5;
              }); 
            }
          }

          if(!window.localStorage) {
            window.localStorage = window.localStorageCopy
          }
          if(!window.sessionStorage) {
            window.sessionStorage = window.sessionStorageCopy
          }
        }
  
        JDCKPlugin.on('show', scrollTopToCKDom);
        JDCKPlugin.on('showConsole', scrollTopToCKDom);
        JDCKPlugin.on('hideConsole', () => scrollTopToCKDom(true));
  
        if (${$.isNeedToolsDomain}) {
          if (_${prefix}_id77_cookies.length > 0) {
             _${prefix}_id77_vConsole.addPlugin(JDCKPlugin);
             _${prefix}_id77_vConsole.showPlugin("jd_cookie");
            _${prefix}_id77_changeTabs();
          }
        }
  
         _${prefix}_id77_vConsole.showPlugin("default");
  
        function createDom(str) {
          let newDiv = document.createElement("div");
          let newContent = document.createTextNode(str);
          newDiv.appendChild(newContent);
          newDiv.style.fontSize = "16px";
          newDiv.addEventListener('click', (e) => {
             _${prefix}_id77_copyText(str)
          })
          return newDiv;
        }
      } catch (err) {
        console.log(arguments.callee.name, err);
      }
    }

    function _${prefix}_id77_copyText(text) {
      const input = document.createElement('input');
      input.setAttribute('readonly', 'readonly');
      input.setAttribute('value', text);
      document.body.appendChild(input);
      input.setSelectionRange(0, input.value.length);
      if (document.execCommand('copy')) {
        document.execCommand('copy');
        console.log('复制成功');
      }
      document.body.removeChild(input);
    }
  </script>`;

  // if (/<script.*v(C|c)onsole(\.min)?\.js.+?script>/i.test(html)) {
  //   html = html.replace(/<script.*v(C|c)onsole(\.min)?\.js.+?script>/i, ``);
  // }
  if (/(<(?:style|link|script)[\s\S]+?<\/head>)/i.test(html)) {
    html = html.replace(
      /(<(?:style|link|script)[\s\S]+?<\/head>)/i,
      `${copyObject}${mitmFuckEid}${scriptDoms}${mitmContent}$1`
    );
  } else {
    html = html.replace(
      /(<\/head>|<script|<div)/i,
      `${copyObject}${mitmFuckEid}${scriptDoms}${mitmContent}$1`
    );
  }

  html = html.replace(/(<\/body>)(?![\s\S]*\1)/, `${mitmFixContent}$1`);
} catch (error) {
  // console.error(arguments.callee.name, error);
  console.log(error);
}

$.done({
  body: html,
  headers: modifiedHeaders,
});

// https://github.com/chavyleung/scripts/blob/master/Env.js
// prettier-ignore
// https://github.com/chavyleung/scripts/blob/master/Env.js
// prettier-ignore
function Env(name, opts) {
  class Http {
    constructor(env) {
      this.env = env;
    }

    send(opts, method = 'GET') {
      opts = typeof opts === 'string' ? { url: opts } : opts;
      let sender = this.get;
      if (method === 'POST') {
        sender = this.post;
      }
      return new Promise((resolve, reject) => {
        sender.call(this, opts, (err, resp, body) => {
          if (err) reject(err);
          else resolve(resp);
        });
      });
    }

    get(opts) {
      return this.send.call(this.env, opts);
    }

    post(opts) {
      return this.send.call(this.env, opts, 'POST');
    }
  }

  return new (class {
    constructor(name, opts = {}) {
      this.name = name;
      this.http = new Http(this);
      this.data = null;
      this.dataFile = 'box.dat';
      this.logs = [];
      this.isMute = false;
      this.noLogKey = opts.noLogKey || '';
      this.noLog = opts.noLog;
      this.isNeedRewrite = false;
      this.logSeparator = '\n';
      this.startTime = new Date().getTime();
      Object.assign(this, opts);
      this.log('', `🔔${this.name}, 开始!`);
    }

    isNode() {
      return 'undefined' !== typeof module && !!module.exports;
    }

    isQuanX() {
      return 'undefined' !== typeof $task;
    }

    isSurge() {
      return 'undefined' !== typeof $httpClient && 'undefined' === typeof $loon;
    }

    isLoon() {
      return 'undefined' !== typeof $loon;
    }

    isShadowrocket() {
      return 'undefined' !== typeof $rocket;
    }

    toObj(str, defaultValue = null) {
      try {
        return JSON.parse(str);
      } catch {
        return defaultValue;
      }
    }

    toStr(obj, defaultValue = null) {
      try {
        return JSON.stringify(obj);
      } catch {
        return defaultValue;
      }
    }

    getJson(key, defaultValue) {
      let json = defaultValue;
      const val = this.getData(key);
      if (val) {
        try {
          json = JSON.parse(this.getData(key));
        } catch {}
      }
      return json;
    }

    setJson(val, key) {
      try {
        return this.setData(JSON.stringify(val), key);
      } catch {
        return false;
      }
    }

    getScript(url) {
      return new Promise((resolve) => {
        this.get({ url }, (err, resp, body) => resolve(body));
      });
    }

    runScript(script, runOpts) {
      return new Promise((resolve) => {
        let httpApi = this.getData('@chavy_boxjs_userCfgs.httpApi');
        httpApi = httpApi ? httpApi.replace(/\n/g, '').trim() : httpApi;
        let httpApi_timeout = this.getData(
          '@chavy_boxjs_userCfgs.httpApi_timeout'
        );
        httpApi_timeout = httpApi_timeout ? httpApi_timeout * 1 : 20;
        httpApi_timeout =
          runOpts && runOpts.timeout ? runOpts.timeout : httpApi_timeout;
        const [key, addr] = httpApi.split('@');
        const opts = {
          url: `http://${addr}/v1/scripting/evaluate`,
          body: {
            script_text: script,
            mock_type: 'cron',
            timeout: httpApi_timeout,
          },
          headers: { 'X-Key': key, Accept: '*/*' },
        };
        this.post(opts, (err, resp, body) => resolve(body));
      }).catch((e) => this.logErr(e));
    }

    loadData() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require('fs');
        this.path = this.path ? this.path : require('path');
        const curDirDataFilePath = this.path.resolve(this.dataFile);
        const rootDirDataFilePath = this.path.resolve(
          process.cwd(),
          this.dataFile
        );
        const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
        const isRootDirDataFile =
          !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
        if (isCurDirDataFile || isRootDirDataFile) {
          const datPath = isCurDirDataFile
            ? curDirDataFilePath
            : rootDirDataFilePath;
          try {
            return JSON.parse(this.fs.readFileSync(datPath));
          } catch (e) {
            return {};
          }
        } else return {};
      } else return {};
    }

    writeData() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require('fs');
        this.path = this.path ? this.path : require('path');
        const curDirDataFilePath = this.path.resolve(this.dataFile);
        const rootDirDataFilePath = this.path.resolve(
          process.cwd(),
          this.dataFile
        );
        const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
        const isRootDirDataFile =
          !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
        const jsonData = JSON.stringify(this.data);
        if (isCurDirDataFile) {
          this.fs.writeFileSync(curDirDataFilePath, jsonData);
        } else if (isRootDirDataFile) {
          this.fs.writeFileSync(rootDirDataFilePath, jsonData);
        } else {
          this.fs.writeFileSync(curDirDataFilePath, jsonData);
        }
      }
    }

    lodash_get(source, path, defaultValue = undefined) {
      const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      let result = source;
      for (const p of paths) {
        result = Object(result)[p];
        if (result === undefined) {
          return defaultValue;
        }
      }
      return result;
    }

    lodash_set(obj, path, value) {
      if (Object(obj) !== obj) return obj;
      if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
      path
        .slice(0, -1)
        .reduce(
          (a, c, i) =>
            Object(a[c]) === a[c]
              ? a[c]
              : (a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {}),
          obj
        )[path[path.length - 1]] = value;
      return obj;
    }

    getData(key) {
      let val = this.getVal(key);
      // 如果以 @
      if (/^@/.test(key)) {
        const [, objKey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
        const objVal = objKey ? this.getVal(objKey) : '';
        if (objVal) {
          try {
            const objedVal = JSON.parse(objVal);
            val = objedVal ? this.lodash_get(objedVal, paths, '') : val;
          } catch (e) {
            val = '';
          }
        }
      }
      return val;
    }

    setData(val, key) {
      let isSuc = false;
      if (/^@/.test(key)) {
        const [, objKey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
        const objdat = this.getVal(objKey);
        const objVal = objKey
          ? objdat === 'null'
            ? null
            : objdat || '{}'
          : '{}';
        try {
          const objedVal = JSON.parse(objVal);
          this.lodash_set(objedVal, paths, val);
          isSuc = this.setVal(JSON.stringify(objedVal), objKey);
        } catch (e) {
          const objedVal = {};
          this.lodash_set(objedVal, paths, val);
          isSuc = this.setVal(JSON.stringify(objedVal), objKey);
        }
      } else {
        isSuc = this.setVal(val, key);
      }
      return isSuc;
    }

    getVal(key) {
      if (this.isSurge() || this.isLoon()) {
        return $persistentStore.read(key);
      } else if (this.isQuanX()) {
        return $prefs.valueForKey(key);
      } else if (this.isNode()) {
        this.data = this.loadData();
        return this.data[key];
      } else {
        return (this.data && this.data[key]) || null;
      }
    }

    setVal(val, key) {
      if (this.isSurge() || this.isLoon()) {
        return $persistentStore.write(val, key);
      } else if (this.isQuanX()) {
        return $prefs.setValueForKey(val, key);
      } else if (this.isNode()) {
        this.data = this.loadData();
        this.data[key] = val;
        this.writeData();
        return true;
      } else {
        return (this.data && this.data[key]) || null;
      }
    }

    initGotEnv(opts) {
      this.got = this.got ? this.got : require('got');
      this.ckTough = this.ckTough ? this.ckTough : require('tough-cookie');
      this.ckJar = this.ckJar ? this.ckJar : new this.ckTough.CookieJar();
      if (opts) {
        opts.headers = opts.headers ? opts.headers : {};
        if (undefined === opts.headers.Cookie && undefined === opts.cookieJar) {
          opts.cookieJar = this.ckJar;
        }
      }
    }

    get(opts, callback = () => {}) {
      if (opts.headers) {
        delete opts.headers['Content-Type'];
        delete opts.headers['Content-Length'];
      }
      if (this.isSurge() || this.isLoon()) {
        if (this.isSurge() && this.isNeedRewrite) {
          opts.headers = opts.headers || {};
          Object.assign(opts.headers, { 'X-Surge-Skip-Scripting': false });
        }
        $httpClient.get(opts, (err, resp, body) => {
          if (!err && resp) {
            resp.body = body;
            resp.statusCode = resp.status;
          }
          callback(err, resp, body);
        });
      } else if (this.isQuanX()) {
        if (this.isNeedRewrite) {
          opts.opts = opts.opts || {};
          Object.assign(opts.opts, { hints: false });
        }
        $task.fetch(opts).then(
          (resp) => {
            const { statusCode: status, statusCode, headers, body } = resp;
            callback(null, { status, statusCode, headers, body }, body);
          },
          (err) => callback(err)
        );
      } else if (this.isNode()) {
        this.initGotEnv(opts);
        this.got(opts)
          .on('redirect', (resp, nextOpts) => {
            try {
              if (resp.headers['set-cookie']) {
                const ck = resp.headers['set-cookie']
                  .map(this.ckTough.Cookie.parse)
                  .toString();
                if (ck) {
                  this.ckJar.setCookieSync(ck, null);
                }
                nextOpts.cookieJar = this.ckJar;
              }
            } catch (e) {
              this.logErr(e);
            }
            // this.ckJar.setCookieSync(resp.headers['set-cookie'].map(Cookie.parse).toString())
          })
          .then(
            (resp) => {
              const { statusCode: status, statusCode, headers, body } = resp;
              callback(null, { status, statusCode, headers, body }, body);
            },
            (err) => {
              const { message: error, response: resp } = err;
              callback(error, resp, resp && resp.body);
            }
          );
      }
    }

    post(opts, callback = () => {}) {
      const method = opts.method ? opts.method.toLocaleLowerCase() : 'post';
      // 如果指定了请求体, 但没指定`Content-Type`, 则自动生成
      if (opts.body && opts.headers && !opts.headers['Content-Type']) {
        opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      if (opts.headers) delete opts.headers['Content-Length'];
      if (this.isSurge() || this.isLoon()) {
        if (this.isSurge() && this.isNeedRewrite) {
          opts.headers = opts.headers || {};
          Object.assign(opts.headers, { 'X-Surge-Skip-Scripting': false });
        }
        $httpClient[method](opts, (err, resp, body) => {
          if (!err && resp) {
            resp.body = body;
            resp.statusCode = resp.status;
          }
          callback(err, resp, body);
        });
      } else if (this.isQuanX()) {
        opts.method = method;
        if (this.isNeedRewrite) {
          opts.opts = opts.opts || {};
          Object.assign(opts.opts, { hints: false });
        }
        $task.fetch(opts).then(
          (resp) => {
            const { statusCode: status, statusCode, headers, body } = resp;
            callback(null, { status, statusCode, headers, body }, body);
          },
          (err) => callback(err)
        );
      } else if (this.isNode()) {
        this.initGotEnv(opts);
        const { url, ..._opts } = opts;
        this.got[method](url, _opts).then(
          (resp) => {
            const { statusCode: status, statusCode, headers, body } = resp;
            callback(null, { status, statusCode, headers, body }, body);
          },
          (err) => {
            const { message: error, response: resp } = err;
            callback(error, resp, resp && resp.body);
          }
        );
      }
    }
    /**
     *
     * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
     *    :$.time('yyyyMMddHHmmssS')
     *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
     *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
     * @param {string} fmt 格式化参数
     * @param {number} 可选: 根据指定时间戳返回格式化日期
     *
     */
    time(fmt, ts = null) {
      const date = ts ? new Date(ts) : new Date();
      let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'H+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
      };
      if (/(y+)/.test(fmt))
        fmt = fmt.replace(
          RegExp.$1,
          (date.getFullYear() + '').substr(4 - RegExp.$1.length)
        );
      for (let k in o)
        if (new RegExp('(' + k + ')').test(fmt))
          fmt = fmt.replace(
            RegExp.$1,
            RegExp.$1.length == 1
              ? o[k]
              : ('00' + o[k]).substr(('' + o[k]).length)
          );
      return fmt;
    }

    /**
     * 系统通知
     *
     * > 通知参数: 同时支持 QuanX 和 Loon 两种格式, EnvJs根据运行环境自动转换, Surge 环境不支持多媒体通知
     *
     * 示例:
     * $.msg(title, subt, desc, 'twitter://')
     * $.msg(title, subt, desc, { 'open-url': 'twitter://', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
     * $.msg(title, subt, desc, { 'open-url': 'https://bing.com', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
     *
     * @param {*} title 标题
     * @param {*} subt 副标题
     * @param {*} desc 通知详情
     * @param {*} opts 通知参数
     *
     */
    msg(title = name, subt = '', desc = '', opts) {
      const toEnvOpts = (rawOpts) => {
        if (!rawOpts) return rawOpts;
        if (typeof rawOpts === 'string') {
          if (this.isLoon()) return rawOpts;
          else if (this.isQuanX()) return { 'open-url': rawOpts };
          else if (this.isSurge()) return { url: rawOpts };
          else return undefined;
        } else if (typeof rawOpts === 'object') {
          if (this.isLoon()) {
            let openUrl = rawOpts.openUrl || rawOpts.url || rawOpts['open-url'];
            let mediaUrl = rawOpts.mediaUrl || rawOpts['media-url'];
            return { openUrl, mediaUrl };
          } else if (this.isQuanX()) {
            let openUrl = rawOpts['open-url'] || rawOpts.url || rawOpts.openUrl;
            let mediaUrl = rawOpts['media-url'] || rawOpts.mediaUrl;
            let updatePasteboard =
              rawOpts['update-pasteboard'] || rawOpts.updatePasteboard;
            return {
              'open-url': openUrl,
              'media-url': mediaUrl,
              'update-pasteboard': updatePasteboard,
            };
          } else if (this.isSurge()) {
            let openUrl = rawOpts.url || rawOpts.openUrl || rawOpts['open-url'];
            return { url: openUrl };
          }
        } else {
          return undefined;
        }
      };
      if (!this.isMute) {
        if (this.isSurge() || this.isLoon()) {
          $notification.post(title, subt, desc, toEnvOpts(opts));
        } else if (this.isQuanX()) {
          $notify(title, subt, desc, toEnvOpts(opts));
        }
      }
      if (!this.isMuteLog) {
        let logs = ['', '==============📣系统通知📣=============='];
        logs.push(title);
        subt ? logs.push(subt) : '';
        desc ? logs.push(desc) : '';
        console.log(logs.join('\n'));
        this.logs = this.logs.concat(logs);
      }
    }

    log(...logs) {
      if (this.noLog || (this.noLogKey && (this.getData(this.noLogKey) || 'N').toLocaleUpperCase() === 'Y')) {
        return;
      }
      if (logs.length > 0) {
        this.logs = [...this.logs, ...logs];
      }
      console.log(logs.join(this.logSeparator));
    }

    logErr(err, msg) {
      const isPrintSack = !this.isSurge() && !this.isQuanX() && !this.isLoon();
      if (!isPrintSack) {
        this.log('', `❗️${this.name}, 错误!`, err);
      } else {
        this.log('', `❗️${this.name}, 错误!`, err.stack);
      }
    }

    wait(time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }

    done(val = {}) {
      const endTime = new Date().getTime();
      const costTime = (endTime - this.startTime) / 1000;
      this.log('', `🔔${this.name}, 结束! 🕛 ${costTime} 秒`);
      this.log();
      if (this.isSurge() || this.isQuanX() || this.isLoon()) {
        $done(val);
      }
    }
  })(name, opts);
}
