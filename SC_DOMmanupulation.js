var msg;
function authenticate() {
  document.querySelector(".notice").innerHTML = "";
  initialization().then(function(){
    SC.connect().then(function(){
      SC.get('users/me').then(function(user){
        if(user.full_name){
          document.querySelector(".name").innerHTML = "Welcome " + user.full_name
          document.querySelector(".links").innerHTML = "<a href = '#' onClick ='reload()'>Log Out</a>"
        }else{
          //show user id
          document.querySelector(".header").innerHTML = "Welcome " + user.username
        }
      })
    })
      .then(function() {
        SC.get('/users/me/tracks')
          .then(function(tracks) {
            if(tracks.length !== 0) {
              for(var j = 0; j<tracks.length; j++){
                document.querySelector(".Tracks_List_Name").innerHTML = " Your Tracks. Enjoy It! "
                document.querySelector(".Tracks_List_Name").style.backgroundColor = "white";
                if(tracks[j].sharing === "public"){
                  document.querySelector(".tracks").innerHTML += "<li><a href = '#/" + tracks[j].permalink_url + "'>" + tracks[j].title + "</a> &nbsp <input type='button' value='share' onClick=existTrackShare()/></li></br>";
                }else if(tracks[j].sharing === "private"){
                  document.querySelector(".tracks").innerHTML += "<li><a href = '#/" + tracks[j].permalink_url + "'>" + tracks[j].title +  "</a> &nbsp <input type='button' value='share' onClick=existTrackShare()/> &nbsp <abbr title = 'This track is private'><i class='fa fa-lock'></i> </abbr></li></br>";
                }
              }
            }else{
              document.querySelector(".Tracks_List_Name").innerHTML = "Sorry there are no tracks right now. Lets upload some tracks.";
              document.querySelector(".Tracks_List_Name").style.backgroundColor = "#CCCCFF";
            }
          })
          .catch(function(e){
            msg = "Authentication failed due to  " + e.message;
            errorNotice(msg);
          });
      })
  })
}

function reload(){
  location.reload();
}

function initialization() {
  return new Promise(function(resolve,reject){
    resolve(
      SC.initialize({
        client_id: "71075b553a37503ce9b98de95c0d975e",
        redirect_uri: 'http://127.0.0.1:8000/callback.html'
      })
    );
  });
}
function uploadFile(arrayOfConnection){
  console.log("in upload file")
  var radio_selection , checked = 0 , shareId = [] ;
  var connectId = location.hash.slice(1);
  if(connectId === ""){
    for(var i = 0; i< arrayOfConnection.length; i++){
      shareId[i] = { id: arrayOfConnection[i].connectionId};
    }
  }else{
    shareId[0] = { id: connectId }
  }

  var blob = document.querySelector("#audio_upload").files[0];
  var title = document.querySelector("#audio_title").value;
  var radio = document.getElementsByName("track_types");

  if(!blob || !title){
    msg = "Please fill the details properly";
    errorNotice(msg);
  }else{
    for(var i = 0; i < 2; i++) {
      if(radio[i].checked){
        radio_selection = radio[i].value;
        checked = 1;
      }
    }
    if(checked === 0){
      msg = "Please select either private or public";
      errorNotice(msg);
    }else{
      initialization()
        .then(function(){
          SC.connect()
            .then(function(radio){
              console.log("shareID ",shareId);
              if(shareId){
                initializationFB();
                SC.upload({
                  file: blob,
                  title: title,
                  sharing: radio_selection,
                  connections: shareId
                }).then(function(track){
                  msg = "You have successfully uploaded '" + title + "'";
                  notice(msg,"greenyellow");
                  console.log("~~~",track.sharing);
                  if(track.sharing === "private") {
                    document.querySelector(".tracks").innerHTML += "<li><a href = '#/" + track.permalink_url + "'>" + title + "</a> &nbsp <input type='button' value='share' onClick=existTrackShare()/> &nbsp <abbr title = 'This track is private'><i class='fa fa-lock'></i> </abbr></li></br>"
                  }else if(track.sharing === "public"){
                    document.querySelector(".tracks").innerHTML += "<li><a href = '#/" + track.permalink_url + "'>" + title + "</a> &nbsp <input type='button' value='share' onClick=existTrackShare()/> </li></br>"
                  }
                });
              }else{
                SC.upload({
                  file: blob,
                  title: title,
                  sharing: radio_selection,
                }).then(function(track){
                  console.log("track types ",track.sharing);
                  document.querySelector(".Tracks_List_Name").innerHTML = "<span id = 'listName'> Your Tracks. Enjoy It! </span>"

                  document.querySelector(".notice").innerHTML = "You have successfully uploaded '" + title + "'";
                  document.querySelector(".notice").style.backgroundColor = "greenyellow";
                });
              }
            })
        });
    }

  }
}

function getConnection(){
  return new Promise(function(resolve,reject){
    SC.get('me/connections').then(function(connections){
      if(connections.length !== 0){
        resolve(connections);
        for(var i = 0;i<connections.length; i++){
          console.log(connections[i]);
        }
      }else{
        reject("There is no connections! First create some connections");
      }
    });
  });
}

function uploadAndShare(){
  if(document.querySelector(".connection").innerHTML === ""){
    getConnection().then(function(connections){
      document.querySelector("#shareAll").innerHTML = "<p><input type='button' value='Share to all of your connections' onClick='shareOnAllConnection()'/></p>"
      for(var i = 0;i<connections.length; i++){
        document.querySelector(".connection").innerHTML += "<li><a href = '#" + connections[i].id + "' onClick='uploadFile()'>" + connections[i].service + "</li>";
      }
    }).catch(function(err){
      notice(err,"red");
    });
  }
}

function shareOnAllConnection(){
  var allConnectionsId = [];
  getConnection().then(function(connections){
    for(var i = 0; i< connections.length; i++){
      allConnectionsId[i] = { connectionName : connections[i].service , connectionId : connections[i].id }
    }
    uploadFile(allConnectionsId);
  })
}

function playThisOne(){
  document.querySelector(".tracks").addEventListener("click", function(e){
    var click = e.target.innerHTML;
    var link = window.location.hash.slice(2);
    document.querySelector(".notice").innerHTML = "Playing "+ click;
    document.querySelector(".notice").style.backgroundColor = "#CCCCFF"
    console.log(link);
    SC.oEmbed(link, {
      auto_play: false,
      iframe: false
    })
      .then(function(embed){
        document.querySelector(".playHere").innerHTML = embed.html;
      })
      .catch(function(e){
        msg = "Your audio can not be played due to " + e.message;
        notice(msg,"red");
      });
  });
}

function notice(string,color){
  document.querySelector(".notice").innerHTML = string;
  document.querySelector(".notice").style.backgroundColor = color;
  document.querySelector(".notice").style.textAlign = "center";
}

function clearField(){
  document.querySelector("div.notice").style.backgroundColor = "white";
  document.querySelector(".audioDetails").reset();
  document.querySelector("div.notice").innerHTML = "";
  document.querySelector("div.playHere").innerHTML = "";
  document.querySelector(".connection").innerHTML = "";
}

function nothing(){
  //nothing
}
