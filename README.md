# ibm-intern-hack19
# Team 10



#### GitHub Voice Assistant powered by Watson 
Our app uses system microphone to record user audio, we process this audio and send it to `Watson's Speech to Text API`.
The keywords returned from Watson are matched for valid `GIT Commands`. If there is a match, I make a REST API Call to GitHub API V3. The data then returned from Github is processed to make a meaningful human understandable format. This is then passed to the `Watson's Text to Speech API`, which finally returns a audio file.
This file is then run on the client browser, to let the system speakers read out loud the git information to the user.

Hope you like the work!


________________________________________________________________________________________
#Demo URL
[Visit App](https://talkingoctocat.us-south.cf.test.appdomain.cloud)

Live URL for the demo:
https://talkingoctocat.us-south.cf.test.appdomain.cloud

*Note:*

1) Login with your personal github account, after successful login select the repo you want to work with on the next screen.

2) Next, click on the Watson logo to start recording and *need to click the second time to stop recording.*

3) You can ask these 2 questions for now!

a)  _List all my commits_

b)  _List all my branches_

(Takes a while to load the audio, so please be patient!  :waitingpatiently:) 


________________________________________________________________________________________
#Team Members:
##### Varun Shrivastav
##### Yaoyan Xi
##### Kavya Sahai
##### Yang Chen
##### Jason Gonsalves
##### Maleeha Koul

