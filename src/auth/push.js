let addDevice = "https://mfa.silencelaboratories.com/api/add_device/";
let checkToken = "https://mfa.silencelaboratories.com/api/async_push_status";
let gestureTfa = "https://mfa.silencelaboratories.com/api/push_auth/";
let evt = document.createEvent("Event");
let dialog = document.querySelector('.dialog');
var timer;

function sl_auth(){
  dialog.classList.remove('hidden');
  if(!localStorage['device']){
    registration()
  }else if(!localStorage['token']){
    document.body.appendChild(dialog)
    pair_token()
  }else{
    start_tfa()
    evt.initEvent("authentication", true, true)
  }
}

function sl_auth_remove(){
  evt.initEvent("authentication", true, true)
  if(localStorage['device'] || localStorage['token']){
    localStorage.clear();
    evt.result = "removed";
    document.dispatchEvent(evt);
  }else{
    evt.result = "not_installed";
    document.dispatchEvent(evt);
  }
}

function registration(){
  dialog.innerHTML = `
    <div class="tfa__section">
      <h2><b>Welcome to the Kampong Auth Installation Wizard.</b></h2>
      <br>
      <h3>Download the Android APK <a href="auth/kampong_auth_v3.1.3.apk">here</a></h3>
      <div style="display:inline-flex;">
        <div>
          <img src="auth/images/logo_new.jpeg" height="200px" width="200px"/><br><br>
        </div>
        <div>
          <img id="insert-qrcode-here" src="auth/images/cjjjE5un_400x400.png" style="margin-left:60px;" height="180px" width="180px"/>
        </div>
      </div>
      <button style="margin-left:105px;" onclick="register();" id="close">REGISTER</button>
    </div>`;
}

function register() {
  return fetch(addDevice)
    .then((res) => res.json())
    .then((device) => {
      localStorage.setItem('device', JSON.stringify(device));
      pair_token();
    })
    .catch((error) => console.log(error));
}


function pair_token(){
  let device = JSON.parse(localStorage.getItem('device'));
  let qr_code = generate_qr(`sldevice://${device.activation_code}`);
  dialog.innerHTML = `
  <div class="tfa__section">
    <h2>Press the finish button after successfully scanning the QR code with the SilentAuth app.</h2>
    <div style="display:inline-flex;">
      <div>
        <img src="auth/images/logo_new.jpeg" height="200px" width="200px"/><br><br>
      </div>
      <div id="insert-qrcode-here" style="margin-left:60px;" height="180px" width="180px">
        <br>${qr_code}<br><br><br>
      </div>
    </div>
    <button style="margin-left:45px;" onclick="finish();" id="finish">FINISH</button>
  </div>`;

  function generate_qr(input){
    var max_window_height = 250;
    var max_qrcode_height = max_window_height - 75; // Reserve "some" space for UI
    var qr_levels = ["M", "L"];
    var qr_modules_by_version = {
      1: 21, 2: 25, 3: 29, 4: 33, 5: 37,
      6: 41, 7: 45, 8: 49, 9: 53, 10: 57
    }
    var createImage = function(payload) {
      var qr_margin = 4;
      for (var levelIndex in qr_levels) {
        for (var typeNum = 1; typeNum <= 10; typeNum++) {
          var qr_cellsize = Math.floor(max_qrcode_height / qr_modules_by_version[typeNum]);
          try {
            var qr = gen_qrcode(typeNum, qr_levels[levelIndex]);
            qr.addData(payload);
            qr.make();
            return qr.createImgTag(qr_cellsize, qr_margin);
          } catch(e) {
            if (strStartsWith(e.message, "code length overflow")) {
              // ignore and try to use bigger QR code format
            } else {
              throw e;
            }
          }
        }
      }
    };
    var strStartsWith = function(string, prefix) {
      return !string.indexOf(prefix);
    };
    payload = input
    return createImage(payload) || "Error. URL too long?"
  }
}

function start_tfa(){
  var device = JSON.parse(localStorage.getItem('device')) 
  var account_info = {
    plugin_token: device['plugin_token'],
    account_id: "sl_auth_demo_account",
    favicon: "auth/images/logo_new.jpeg"
  }
  start_gesture_tfa(account_info, account_info['account_id']);
}

function finish(){
  localStorage.setItem('token', 'true');
  dialog.classList.add('hidden');
}

function close_window(){
  dialog.classList.add('hidden');
}


function close_proceses(){
  clearTimeout(timer)
  dialog.classList.add('hidden');
}

function start_gesture_tfa(account_info, account_id){
  let data = { "account_id": account_id};
  return fetch(gestureTfa, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': account_info.plugin_token
      },
      body: JSON.stringify(data)
    }).then((resp) => resp.json())
    .then((resp) => {
      showAnimation(account_info, resp.gesture_name);
      check_token_verification(account_info, account_id, resp.push_id);		 
    });
}

function check_token_verification(account_info, account_id, push_id) {
  return fetch(`${checkToken}/${account_id}/${push_id}/`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': account_info.plugin_token
    }}).then((resp) => resp.json())
    .then((resp) => {
        dialog.classList.add('hidden');
        evt.result = resp.result;
        document.dispatchEvent(evt);
    });
}

function showAnimation(account_info, animation){
  var favicon = account_info['favicon']
  dialog.innerHTML  = `
    <div class="tfa__section">
      <h1><b>Replicate the gesture with your phone</b></h1><br>
        <div>
          <img src="auth/images/${animation}.gif" height="500px" width="350px" />
          <img src="${favicon}" style="margin-left:70px;" height="64px" width="64px" /><br><br><br><br><br>
        </div>
      </div>
    </div>`;
}
