var express  = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var ejs = require("ejs");

app.engine('ejs',ejs.renderFile);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

// （暫定）会話用のIDを設定
var myID = '01';
var f1ID = '02';

// （暫定）会話用のコレクション名を作成
var chatCollection = myID + f1ID;

//　MongoDBに接続
mongoose.connect('mongodb://localhost/mydb');

// （暫定）会話格納用（スタンプや画像はまだ）
var Chats = mongoose.model(chatCollection, {
    fromAddress : String,
    toAddress : String,
    message : String,
    timeStamp :String
});

//  最初の挨拶を登録
Chats.create({
    fromAddress : f1ID,
    toAddress : myID,
    message : 'こんにちは',
    timeStamp : getDateTime()
    });

// 直近の会話を比較用に保存
var resentMsg = "---";
var query = { "fromAddress": "01" };
    Chats.find(query,{},{sort:{_id: -1},limit:1}, function(err, data){
        if(err){
            console.log(err);
        }
        if(!data){
            if (data[0].timeStamp !==''){
                resentMsg =data[0].timeStamp + data[0].message;
            }
        }
    });

// クライアントからgetされると会話全件をjsonで返す
app.get('/api/messages', (req, res) => {
    Chats.find()
            .then((messages) => {
            res.json(messages);
        })
        .catch((err) => {
            res.send(err);
        })
});

// 会話内容がポストされれば、それを登録する
app.post('/api/messages', (req, res) => {
    var postData = req.body;

    Chats.create({
            fromAddress : myID,
            toAddress : f1ID,
            message : postData.mess,
            timeStamp : getDateTime()
        })
        .then((postData) => {
            res.json(postData);
        })
        .catch((err) => {
            res.send(err);
        });
});

// （暫定）1秒ごとに新しいメッセージを検索する
const timer = setInterval(function(){
    var query = { };
    Chats.find(query,{},{sort:{_id: -1},limit:1}, function(err, data){
        if(err){
            console.log(err);
        }
        if ( data[0].fromAddress == '01') {
            if ( resentMsg != data[0].timeStamp + data[0].message) {
                resentMsg = data[0].timeStamp + data[0].message;
                msgFooking(data[0].message);
            }
        }
    });
},1000);

// （暫定）ECHOさんの処理
function msgFooking(msg){
    Chats.create({
        fromAddress : f1ID,
        toAddress : myID,
        message : msg + "ですね",
        timeStamp : getDateTime()
    });
}


// ルートアクセス時にベースの画面を返す
// 友達の名前とそれぞれのIDをEJSでHTMLに埋め込む
app.get('/', (req, res) => {
    res.render('chatapp.ejs',
        {frendName: 'Echo' ,
         myidf: myID ,
         fiidf: f1ID });
});

// 日時の整形処理
function getDateTime(){
    var date = new Date();

    var year_str = date.getFullYear();
    var month_str = date.getMonth();
    var day_str = date.getDate();
    var hour_str = date.getHours();
    var minute_str = date.getMinutes();
    var second_str = date.getSeconds();

    month_str = ('0' + month_str).slice(-2);
    day_str = ('0' + day_str).slice(-2);
    hour_str = ('0' + hour_str).slice(-2);
    minute_str = ('0' + minute_str).slice(-2);
    second_str = ('0' + second_str).slice(-2);

    format_str = 'YYYY/MM/DD hh:mm:ss';
    format_str = format_str.replace(/YYYY/g, year_str);
    format_str = format_str.replace(/MM/g, month_str);
    format_str = format_str.replace(/DD/g, day_str);
    format_str = format_str.replace(/hh/g, hour_str);
    format_str = format_str.replace(/mm/g, minute_str);
    format_str = format_str.replace(/ss/g, second_str);

    return format_str;

}

// ポート3000で待ち受け
app.listen(3000, () => {
    console.log("起動しました　ポート3000");
});