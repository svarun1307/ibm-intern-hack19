require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const request = require('request');
const qs = require('querystring');
const url = require('url');
const randomString = require('randomstring');
const path = require("path");
const pug = require('pug');
const fs = require('fs');
var glob = require("glob");


var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, "git_audio.wav");
    }
  });
var upload = multer({ storage: storage })


const port = process.env.PORT || 3000;
const redirect_uri = process.env.HOST + '/redirect';

app.use(express.static('src'));

app.use(
  session({
    secret: randomString.generate(),
    cookie: { maxAge: 60000, httpOnly: false },
    resave: false,
    saveUninitialized: false
  })
);




app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/src/views/index.html');
  if(req.session.access_token){
    res.redirect('/user');
  }
  else{
    //res.redirect('/');
  }
});




app.get('/login', (req, res, next) => {
  req.session.csrf_string = randomString.generate();
  const githubAuthUrl =
    'https://github.com/login/oauth/authorize?' +
    qs.stringify({
      client_id: process.env.CLIENT_ID,
      redirect_uri: redirect_uri,
      state: req.session.csrf_string,
      scope: 'user:email'
    });
  res.redirect(githubAuthUrl);
});




app.all('/redirect', (req, res) => {
  const code = req.query.code;
  const returnedState = req.query.state;
  if (req.session.csrf_string === returnedState) {
    request.post(
      {
        url:
          'https://github.com/login/oauth/access_token?' +
          qs.stringify({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: code,
            redirect_uri: redirect_uri,
            state: req.session.csrf_string
          })
      },
      (error, response, body) => {
          //console.log(body);
        req.session.access_token = qs.parse(body).access_token;
        res.redirect('/user');
      }
    );
  } else {
    res.redirect('/');
  }
});





app.get('/user', (req, res) => {
  console.log(req.session.access_token);
  console.log(req.session.selectedRepo);


  if(req.session.access_token && req.session.selectedRepo){
    //Go to Audio Page
    console.log("Going in 1st");
    res.redirect("/sendercheck");
  }
  else if(req.session.access_token && !req.session.selectedRepo){
    //No Repo selected
    console.log("Going in 2nd");
    
    request.get(
      {
        url: 'https://api.github.com/user/repos',
        headers: {
          Authorization: 'token ' + req.session.access_token,
          'User-Agent': 'Login-App',
          'type': 'owner'
        }
      },
      (error, response, body) => {
        if(error){
            //res.send("/error");
        }
        let d = body;
        let data = {
            repos:JSON.parse(d)
        };
        console.log(d);
        const compiledFunction = pug.compileFile(__dirname+path.normalize('/src/templates/repos.pug'));
        res.end(compiledFunction(data));  
      }
    );


  
  }
  else{
    console.log("Going in 3rd");
    //No login, then go back to root
    //TODO : SEND TO LOGIN
    res.send("heello world");
    //res.redirect("/send-login");
  }




//   request.get(
//     {
//       url: 'https://api.github.com/user/public_emails',
//       headers: {
//         Authorization: 'token ' + req.session.access_token,
//         'User-Agent': 'Login-App'
//       }
//     },
//     (error, response, body) => {
//       console.log(
//         "<p>You're logged in! Here's all your emails on GitHub: </p>" +
//           body +
//           '<p>Go back to <a href="./">log in page</a>.</p>'
//       );
//     }
//   );

    //Access User Repos
    // request.get(
    //   {
    //     url: 'https://api.github.com/user/repos',
    //     headers: {
    //       Authorization: 'token ' + req.session.access_token,
    //       'User-Agent': 'Login-App',
    //       'type': 'Owner'
    //     }
    //   },
    //   (error, response, body) => {
    //     res.send(
    //       "<p>You're logged in! Here's all your repos on GitHub: </p>" +
    //         body +
    //         '<p>Go back to <a href="./">log in page</a>.</p>'
    //     );
    //   }62fce1ea19a5620fe6ccabf75f7099286680b541
    // );

    // request.get(
    //   {
    //     url: 'https://api.github.com/repos/svarun1307/editable-html-tables/commits',
    //     headers: { 
    //       Authorization: 'token ' + req.session.access_token,
    //       'User-Agent': 'Login-App',
    //       'type': 'Owner'
    //     }
    //   },
    //   (error, response, body) => {
    //     res.send(
    //       "<p>You're logged in! Here's all your repos on GitHub: </p>" +
    //         body +
    //         '<p>Go back to <a href="./">log in page</a>.</p>'
    //     );
    //   }
    // );


});





app.get("/select-repo-choice",(req,res)=>{

    //console.log(req.query);
    if(req.query.repo && req.query.repo_id){
        console.log("yes");
        
        req.session.selectedRepo = req.query.repo;
        req.session.selectedRepoId = req.query.repo_id;
        req.session.userLogin = req.query.owner;
        console.log(req.session);
        res.redirect("/voice");
    }
    else{
        //TODO: REDIRECT TO LOGIN
    }
});

app.get("/voice",(req,res)=>{
    const compiledFunction = pug.compileFile(__dirname+path.normalize('/src/templates/voice.pug'));
    res.end(compiledFunction({}));  
})



const formatDate = function(timestamp){

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let date = new Date(timestamp);
  let day = date.getDate();
  day = day.toString().length==2?day:"0"+day;
  let month = monthNames[date.getMonth()];
  let year = date.getFullYear();
  return month + " " + day + ", " + year + " at " + date.getHours() + " : " + date.getMinutes();
};




app.post('/upload', upload.single('audio_data'), (req, res) => {
    //Move file to uploads folder
    try {
      req.session.currentFileObject = req.file;
      //console.log(req.session);
      let possibleKeysWordForGitHub = ["com","br"];
      
      
      /***
        API TO SPEECH TO TEXT
      */

     var SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
     var fs = require('fs');
     
     var speechToText = new SpeechToTextV1({
      iam_apikey: '',
      url: 'https://stream.watsonplatform.net/speech-to-text/api'
     });
     
     var params = {
       objectMode: true,
       content_type: 'audio/wav',
       model: 'en-US_BroadbandModel',
       max_alternatives: 3
     };
     
     console.log(params);
     // Create the stream.
     var recognizeStream = speechToText.recognizeUsingWebSocket(params);
     
     // Pipe in the audio.
     fs.createReadStream('uploads/git_audio.wav').pipe(recognizeStream);
     
     // Listen for events.
     recognizeStream.on('data', function(event) { onEvent('data', event); });
     recognizeStream.on('error', function(event) { onEvent('Error:', event); });
     recognizeStream.on('close', function(event) { onEvent('Close:', event); });
     
     // Display events on the console.
     function onEvent(name, event) {

        if(name=="data"){
           let s = event;
           console.log(s["results"][0]);
           let array_dt = s["results"][0]["alternatives"];
           console.log(array_dt);
           let commitString = "";
           let counter;
           let bls = false;
           let array_index = -1;
           for(var sx =0; sx<array_dt.length; sx++)
           {
            for(var s2=0; s2<possibleKeysWordForGitHub.length;s2++)
            {
              if(!bls && array_dt[sx]["transcript"].indexOf(possibleKeysWordForGitHub[s2])!=-1){
                bls = true;
                array_index = s2;
                break;
              }
              
            }
           }
            
            
              if(bls)
              {
                console.log(":the array index"+array_index);
              if(array_index==0)
              {
                              console.log("YES MATCH");
                              console.log(req.session);
                                let repos_1 = req.session.selectedRepo;
                                let respos_2 = req.session.userLogin;
                                let urldemo = 'https://api.github.com/repos'+'/'+repos_1+'/commits';
                                console.log(urldemo);
                                  request.get(
                                    {
                                      //url: 'https://api.github.com/repos/svarun1307/editable-html-tables/commits',
                                      url: urldemo,
                                      headers: { 
                                        Authorization: 'token ' + req.session.access_token,
                                        'User-Agent': 'Login-App',
                                        'type': 'Owner'
                                      }
                                    },
                                    (error, response, body) => {
                                      //console.log(body);
                                      //console.log(typeof body);
                                      let j = JSON.parse(body);
                                      //console.log(j);
                                      console.log(typeof j);
                                      
                                      counter=0;
                                      for(let v = j.length-1 ; v>=0; v--){
                                        if(counter==0){
                                          commitString += "Your latest commit message was ";
                                          
                                          let date_string = formatDate(new Date(j[v]["commit"]["committer"]["date"]).getTime());
                                          //date_string = date_string.getDate() + date_string.getHours() + " : " + date_string.getMinutes();
                                          commitString += j[v]["commit"]["message"]+". It was done on " + date_string + ". ";
                                        }
                                        else if(counter==1){
                                          
                                          let date_string = formatDate(new Date(j[v]["commit"]["committer"]["date"]).getTime());
                                          commitString += "Your second latest commit message was ";
                                          commitString += j[v]["commit"]["message"]+". It was done on " + date_string + ". ";
                                        }
                                        else if(counter==2){
                                          let date_string = formatDate(new Date(j[v]["commit"]["committer"]["date"]).getTime());
                                          commitString += "Your third latest commit message was ";
                                          commitString += j[v]["commit"]["message"]+". It was done on " + date_string + ". ";
                                        }

                                        counter+=1;
                                        if(counter==j.length || counter==3){
                                          console.log(commitString);

                                          /*****
                                           * 
                                           * Audio File
                                           * 
                                           */
                                          function grabAudioFile(data){
                                            let fs = require('fs');
                                            let TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
                                          
                                            let textToSpeech = new TextToSpeechV1({
                                              iam_apikey: '',
                                            });
                                          
                                            let synthesizeParams = {
                                              text: data ,
                                              accept: 'audio/wav',
                                              voice: 'en-US_AllisonVoice',
                                            };
                                          
                                            //console.log(synthesizeParams);
                                            textToSpeech.synthesize(synthesizeParams)
                                              .then(audio => {
                                          
                                                
                                                //let name = new Date().getTime()+".wav";
                                                let name = "src/op_audio.wav";
                                                audio.pipe(fs.createWriteStream(name,{
                                                  flags: "w"
                                                }),function(err){
                                                  if(err) throw err;
                                                  res.send(req.file);
                                                });

                                                //Play Audio NOde
                                                //var player = require('play-sound')(opts = {})
              
              // $ mplayer foo.mp3 
                                                //player.play('src/op_audio.wav', function(err){
                                                // if (err) throw err
                                                  res.send(req.file);
                                                //})
                                                
                                                
                                                
                                              })
                                              .catch(err => {
                                                console.log('error:', err);
                                              });
                                          }
                                          


                                          grabAudioFile(commitString);
                                          //res.statusCode(200);
                                          
                                          break;
                                        }
                                        
                                      }
                                    }
                                  );

                }
                else if(array_index==1){

                    //Branch
                    console.log("YES MATCH 222");
                              console.log(req.session);
                                let repos_1 = req.session.selectedRepo;
                                let respos_2 = req.session.userLogin;
                                let urldemo = 'https://api.github.com/repos'+'/'+repos_1+'/branches';
                                console.log(urldemo);
                                  request.get(
                                    {
                                      //url: 'https://api.github.com/repos/svarun1307/editable-html-tables/commits',
                                      url: urldemo,
                                      headers: { 
                                        Authorization: 'token ' + req.session.access_token,
                                        'User-Agent': 'Login-App',
                                        'type': 'Owner'
                                      }
                                    },
                                    (error, response, body) => {


                                      console.log(body);
                                      console.log(typeof body);
                                      let j = JSON.parse(body);
                                      //console.log(j);
                                      console.log(typeof j);
                                      
                                      counter=0;
                                      for(let v = j.length-1 ; v>=0; v--){
                                        if(counter==0){
                                          
                                          
                                          //let date_string = formatDate(new Date(j[v]["commit"]["committer"]["date"]).getTime());
                                          //date_string = date_string.getDate() + date_string.getHours() + " : " + date_string.getMinutes();
                                          commitString += "Your latest created branch is " + j[v]["name"]+". ";//["message"]+" on " + date_string + ". ";
                                        }
                                        else if(counter==1){
                                          
                                          //let date_string = formatDate(new Date(j[v]["commit"]["committer"]["date"]).getTime());
                                          commitString += "Your second latest branch is ";
                                          commitString += j[v]["name"]+". ";
                                        }
                                        else if(counter==2){
                                          commitString += "Your third latest branch is ";
                                          commitString += j[v]["name"]+". ";
                                        }
                                        else if(counter==3){
                                          commitString += "Your fourth latest branch is ";
                                          commitString += j[v]["name"]+". ";
                                        }
                                        else if(counter==4){
                                          commitString += "Your figth latest branch is ";
                                          commitString += j[v]["name"]+". ";
                                        }

                                        counter+=1;
                                        if(counter==j.length || counter==5){
                                          console.log(commitString);

                                          /*****
                                           * 
                                           * Audio File
                                           * 
                                           */
                                          function grabAudioFile(data){
                                            let fs = require('fs');
                                            let TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
                                          
                                            let textToSpeech = new TextToSpeechV1({
                                              iam_apikey: '',
                                            });
                                          
                                            let synthesizeParams = {
                                              text: data ,
                                              accept: 'audio/wav',
                                              voice: 'en-US_AllisonVoice',
                                            };
                                          
                                            //console.log(synthesizeParams);
                                            textToSpeech.synthesize(synthesizeParams)
                                              .then(audio => {
                                          
                                                
                                                //let name = new Date().getTime()+".wav";
                                                let name = "src/op_audio.wav";
                                                audio.pipe(fs.createWriteStream(name,{
                                                  flags: "w"
                                                }),function(err){
                                                  if(err) throw err;
                                                  res.send(req.file);
                                                });

                                                //Play Audio NOde
                                                //var player = require('play-sound')(opts = {})
              
              // $ mplayer foo.mp3 
                                                //player.play('src/op_audio.wav', function(err){
                                                // if (err) throw err
                                                  res.send(req.file);
                                                //})
                                                
                                                
                                                
                                              })
                                              .catch(err => {
                                                console.log('error:', err);
                                              });
                                          }
                                          

                                          commitString += "Please note: this is a list of only your latest 5 branches.";
                                          grabAudioFile(commitString);
                                          //res.statusCode(200);
                                          
                                          break;
                                        }
                                        
                                      }
                                    }
                                  );



                }


              }


            }
            





      /***********TEXT TO SPEECH********/



      

        //  console.log(name, JSON.stringify(event, null, 2));
        
     };
     





      //res.send(req.file);
    }catch(err) {
      res.send(400);
    }
  });

app.get("/curl1",function(req,res){
  var request = require('request');

var headers = {
    'Content-Type': 'application/json',
    'Accept': 'audio/wav'
};

var dataString = '{"text":"hello world"}';

var options = {
    url: 'https://stream.watsonplatform.net/text-to-speech/api',
    method: 'POST',
    headers: headers,
    body: dataString,
    auth: {
        'apikey': ''
    }
};

console.log(options);

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
}

request(options, callback);

});

app.listen(port, () => {
  console.log('Server listening at port ' + port);
});
