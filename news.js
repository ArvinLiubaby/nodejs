// module.exports = {
//     news: function (event, context) {

const request = require("sync-request");
const requestSync = require("request").defaults({
    proxy: "http://10.244.2.5:8099",
    // proxy: "xz.proxy.cnsuning.com:8080",
    rejectUnauthorized: false,
});

const neoUrl = 'http://neobpsit.cnsuning.com/app/query';
const newsUrl = 'http://10.37.2.61:30011/biucms/news/info/';

// 常量
const untarget = '技能未命中';
const IFENG_FM = "10006";
const LETING = "10004";
const logid = 1231234;

/**
 * 乐听头条API
 */
const LETING_APP_ID = "f03268abb256885da72e046b556a588c";
const LETING_APP_KEY = "a595a43547ed414e2e96378a338f2f21";
const LETING_UID = "e10adc3949ba59abbe56e057f20f883e";
const LETING_AUTH_URL = "https://app.leting.io/auth";
const LETING_PLAY_URL = "https://app.leting.io/play/url/";

//凤凰FM接口域名
const IFENG_URL = "http://fm.ifeng.com/fm/read/fmd/api/";

//凤凰FM获取单期内容URL
const IFENG_HTML = "/getResourceByRid_240.html";

//凤凰FM appid
const IFENG_APP_ID = "KJJKN";
const IFENG_APP_KEY = "SRGzDJwPbYkTJF2T"

// md5
const md5 = require('md5-nodejs');
const urlencode = require('urlencode');

// 请求新闻数据，目前写死
const requestData = { "program_type": "新闻" };
// const requestData = { "program_type": "新闻", "source_code": "10006" };

// get postData from event
function getInput(event) {
    var postData = event['data'];
    return postData;
}

// 获取neobp信息
function getNeo(pData) {
    var res = request('POST', neoUrl, { json: pData, });
    return JSON.parse(res.getBody('utf8'));
};

// the response result
function resp() {
    console.log('return result');
}

let synchronous_post = function (url, params) {

    let options = {
        url: url,
        form: params
    };

    return new Promise(function (resolve, reject) {
        requestSync.get(options, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

let syncBody = async function (url) {
    // let url = "http://www.baidu.com/";
    var url = url;
    let body = await synchronous_post(url);
    // console.log('##### BBBBB', body);
    return JSON.parse(body);
}

// 获取凤凰数据
async function getIfengUrl(tid) {
    if (tid == null) {
        return null;
    }
    /**
     * 凤凰FM接口文档：http://fmapi.ifeng.com/fmapidoc/web/#/4
     *
     * Sign 是由所有入参不包括sign本身，按照参数名ASCII码从小到大排序并按特定格式拼装组成字符串加密获得。参数拼装格式如下：
     * Sign = md5(key1=value1&key2=value2&…keyn=valuen&APPKEY)
     *
     * 根据tid获取播放地址的请求url为:http://fm.ifeng.com/fm/read/fmd/public/api/[appid]/[sign]/[rid]/getResourceByRid_240.html
     *
     */
    var source = 'appid=' + IFENG_APP_ID + '&rid=' + tid + '&' + IFENG_APP_KEY;
    console.log('##### source', source);
    var sign = md5(source);
    console.log('##### sign', sign);
    var requestUrl = IFENG_URL + IFENG_APP_ID + '/' + sign + '/' + tid + IFENG_HTML;
    console.log('##### requestUrl', requestUrl);

    var rst = '';
    try {
        var body = await syncBody(requestUrl);
        console.log('##########################################################', body);

        if (0 == body['code']) {
            rst = filePath = body['data']['audiolist'][0]['filePath'];
            // console.log('##### RST INNER', rst);
        } else {
            console.log('##### 调用接口失败', body);
        }

    } catch (e) {
        console.log('##### 调用接口失败:EXCETION', e);
    }
    console.log('##### RST OUTER', rst);
    return rst;
}

// get leting url
async function getLeting(sid, logid) {

    if (sid == null) {
        return null;
    }
    // get leting token
    var url = LETING_AUTH_URL + "?uid=" + LETING_UID + "&appid=" + LETING_APP_ID + "&app_secret=" + LETING_APP_KEY + "&logid=" + logid;
    console.log('##### url:', url);

    var body = await syncBody(url);
    var token = '';
    console.log('##### letingtoken:', body);
    if ('200' == body['code']) {
        token = body['data']['token'];
    }
    console.log('##### TOKEN GAIN', urlencode(token));

    // get leting url
    var requestUrlLT = LETING_PLAY_URL + "?uid=" + LETING_UID + "&sid=" + sid + "&logid=" + logid + "&token=" + urlencode(token);
    console.log('##### requestUrlLT:', requestUrlLT);
    var body = await syncBody(requestUrlLT);
    var rst = '';
    console.log('##### getLetingUrl:', body);
    if ('200' == body['code']) {
        rst = body['data']['url'];
    }
    console.log('##### TOKEN GAIN', rst);
    return rst;   //
}

// get news info
function getNews(adviseData) {
    var domain = adviseData['domain'];
    var intent = adviseData['intent'];

    if (domain != 'SKILL' || intent != 'playNews') {
        return untarget;
    }
    var res = request('POST', newsUrl, { json: requestData, });
    var newsList = JSON.parse(res.getBody('utf8'));
    if (newsList['code'] == '0') {
        return newsList['data'][0];
    } else {
        console.log('调用新闻资源接口错误======= ')
        return '';
    }
}

console.log('################################### START ###################################');
// var postData = getInput(event);
// console.log('##### postData:', postData);

// in param
var postData = {
    "timeStamp": "1573039731166",
    "botKey": "7u770YLUFj9Zp87JG1",
    "sign": "d77cd0d2c5e9cc7df94ebff57c64d72c",
    "rawQuestion": "播放新闻",
    "msgId": "1c814cb8bb8ad4d0e31725f8a7b2b5e2",
    "sessionId": "536a0fd36aa4889599d2865b982993cb",
    "version": "1.0"
};

var neoData = getNeo(postData);
var retStatus = neoData['retStatus'];
var retDesc = neoData['retDesc'];
var bizErrorCode = neoData['bizErrorCode'];
var adviseData = neoData['adviseData'];

console.log('##### retDesc:', retDesc);
console.log('##### retStatus:', retStatus);
console.log('##### neoData:', neoData);

if (retStatus == 0) {
    console.log('##### retStatus', retStatus);
    return retDesc;
} else if (retStatus == 2) {
    console.log('##### retStatus', retStatus);
    return '接口被限流';
} else if (retStatus == 1) {
    if (bizErrorCode == null) {
        var newsInfo = getNews(adviseData);
        if ('' == newsInfo) {
            return '获取信息失败';
        }
        console.log('##### newsInfo', newsInfo);
        var sourceCode = newsInfo['source_code'];
        var result = '';
        if (sourceCode == LETING) {

            // 乐听
            console.log('##### 乐听');
            var sid = newsInfo['third_id'];
            result = getLeting(sid, logid);
            console.log('##### 乐听返回结果', result);
            return result;
        } else {
            // 凤凰
            console.log('##### 凤凰');
            var tid = newsInfo['tid'];
            result = getIfengUrl(tid);
            console.log('##### 凤凰返回结果', result);
            return result;
        }
    } else {
        return bizErrorCode;
    }
} else {
    return "Hello World";
}


//     }

// };
