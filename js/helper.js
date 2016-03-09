var popWindow=require('../../views/popWindow/template.html');
popWindow= _.template(popWindow);

var showWeixinTip=require('../../views/shareWeixin/tip/tip.html');
showWeixinTip= _.template(showWeixinTip);

var fundTip=require('../../views/shareWeixin/tip/fund.html');
fundTip=_.template(fundTip);
//    组合接口
$.extend($, {
//    var data=[{
//                type: 'GET',
//                url: '/v1/tag/语法/topic/?tagtype=user&order=1&page=1&pagesize=10'
//            },{
//                type: 'GET',
//                url: '/v1/tag/语法/topic1/?tagtype=user&order=1&page=1&pagesize=10'
//            }];
//    $.ajaxBatch(data,function(data,index){
//        if(index==0){
//            fn1(data)
//        }
//        if(index==1){
//            fn2(data)
//        }
//    });
    ajaxBatch: function (data,
                         success, err) {
        var pack = function (data, boundary) {
                var body = [];

                $.each(data, function (i, d) {
                    var t = d.type.toUpperCase(), noBody = ['GET', 'DELETE'];

                    body.push('--' + boundary);
                    body.push('Content-Type: application/http; msgtype=request', '');

                    if(t=='GET'){
                        d.url = d.url + (d.url.indexOf('?')>0?'&':'?')+'sourceID='+ ($.isWeixin()?1000:1);
                    }else if(d.data){
                        d.data.sourceID=sourceID;
                    }else{
                        d.data={
                            sourceID:sourceID
                        };
                    }

                    body.push(t + ' ' + d.url + ' HTTP/1.1');

                    /* Don't care about content type for requests that have no body. */
                    if (noBody.indexOf(t) < 0) {
                        body.push('Content-Type: ' + (d.contentType || 'application/json; charset=utf-8'));
                    }

                    body.push('Host: ' + location.host);
                    body.push('', d.data ? JSON.stringify(d.data) : '');
                });

                body.push('--' + boundary + '--', '');

                return body.join('\r\n');
            },
            unpack = function (xhr, status, complete) {
                var lines = xhr.responseText.split('\r\n'),
                    boundary = lines[0], data = [], d = null;

                $.each(lines, function (i, l) {
                    if (l.length) {
                        if (l.indexOf(boundary) == 0) {
                            if (d) data.push(d);
                            d = {};
                        } else if (d) {
                            if (!d.status) {
                                d.status = parseInt((function (m) {
                                    return m || [0, 0];
                                })(/HTTP\/1.1 ([0-9]+)/g.exec(l))[1], 10);
                            } else if (!d.data) {
                                try {
                                    d.data = JSON.parse(l);
                                } catch (ex) { }
                            }
                        }
                    }
                });
                complete(data);
            },
            boundary = $.uniqID(),
            ajaxBatchRender = function (d) {
                $.each(d, function (i, n) {
                    if (n.status >= 400) {
                        if ($.type(err) == 'function') {
                            err(n.data);
                        } else {
                            $.toast(n.data.message, 500);
                        }
//                        console.log(n.status+' '+data[i].url, n.data.message, n.data.messageDetail);
//                        throw new Error(n.status+' '+data[i].url);
                    } else if ($.type(success) == 'function') {
                        if(data.length>1){
                            if(n.data.status==0){
                                success(n.data.data,i + 1);
                            } else if ($.type(err) == 'function') {
                                err(n.data,i + 1);
                            } else {
                                //暂时屏蔽错误的输出
//                                $.toast(n.data.message, 500);
//                                console.log(data[i].url,n.data.message);
                            }
                        } else {
                            success(n.data, i + 1);
                        }
                    }
                });
            };

        $.ajax({
            type: 'post',
            url: st.cfg.batch,
            dataType: 'json',

            data: pack(data, boundary),
            contentType: 'multipart/mixed; boundary="' + boundary + '"; charset=utf-8',
            complete: function (xnr, status) {
                unpack(xnr, status, ajaxBatchRender);
//                $.checkFooter();
            },
            error: function (e) {
                if (e.status >= 400) {
                    $.serverError();
                }
            }
        });
    }
});

$.extend($, {
    //格式化日期显示
    dateFormat: function (date, fmt)
    {
        //指定fmt 格式，按照fmt格式输出
        //未指定fmt 按照语义化输出。
        if(!date) return '';
        function _getDateStr(d) {
            if(!d) return '';
            return d.toString().replace('T', ' ').replace(/-/g, '/').split('+')[0].split('.')[0];
        }
        function _isDate(date) {
            return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
        }
        if(!_isDate(date))
            date = new Date(_getDateStr(date));

        var now=new Date(),
            o = {
                "M+": date.getMonth() + 1,
                "d+": date.getDate(),
                "h+": date.getHours(),
                "m+": date.getMinutes(),
                "s+": date.getSeconds(),
                "q+": Math.floor((date.getMonth() + 3) / 3),
                "S": date.getMilliseconds()
            },
            format=function(fmt){
                if (/(y+)/.test(fmt))
                    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                for (var k in o)
                    if (new RegExp("(" + k + ")").test(fmt))
                        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                return fmt;
            };
        if (fmt) {
            return format(fmt);
        } else {
            var ts = new Date().getTime() - date.getTime();
            if (!date || ts <= 3000) return '刚刚';
            if (Math.floor(ts / 1000) < 59) return Math.floor(ts / 1000) + '秒前';
            if (Math.floor(ts / 60000) < 59) return Math.floor(ts / 60000) + '分钟前';
            if (Math.floor(ts / 3600000) < 24) return Math.floor(ts / 3600000) + '小时前';
            if (Math.floor(ts / 86400000) <= 10) return Math.floor(ts / 86400000) + '天前';
            if(now.getFullYear()==date.getFullYear()){
                return format('MM-dd hh:mm');
            }else{
                return format('yyyy-MM-dd hh:mm');
            }
        }
    },
    //处理结构化数据
    contentFormat:function(str,ext){
        if (!ext) {
            return str;
        }
        if (!str) {
            return '';

        }
        str=str.replace(/\n/g,'<br>');
        var getRegExp=function(string) {
            return new RegExp('\\[' + string.substr(1, string.length - 2) + '\\]', 'g');
        };
        var getAudio=function (url) {
//            return '<audio src="' + url + '" controls="controls" class="audio_player"></audio>';
            return '<div class="audio_player clearfix"> <span class="play_time"></span> <span class="sound"></span> <audio class="audio" controls="none" data-src="'+url+'">不支持音频播放</audio> </div>';
        };
        var getVideo=function (url) {
            return '<video data-src="' + url + '" controls="controls" class="video_player"></video>';
        };
        var getDictAudio=function(url,link,title){
            return '<a href="'+link+'">'+title+'</a> <a class="audio_voice_track" href="javascript:void(0);">'
                +'<img align="absmiddle" width="16" height="16" src="http://common.hjfile.cn/site/images/btn_voice.gif" title="点击发音" class="img_reset_size">'
                +'<audio class="hide" controls="controls"><source src="'+url+'" type="audio/mpeg"></audio></a>';
        };
        if(ext.emotion)
            $.each(ext.emotion, function (i, n) {
                str = str.replace(getRegExp(n.ref), '<img src="' + n.src + '">');
            });
        if(ext.img)
            $.each(ext.img, function (i, n) {
    //            str = str.replace(getRegExp(n.ref), '');
                str = str.replace(getRegExp(n.ref), '<img src="' + $.imageFormat(n.src,828) + '" data-originalsize="'+ n.width+'|'+ n.height+'">');
            });
        if(ext.url)
            $.each(ext.url, function (i, n) {
                var id = $.parseURL(n.src).path.match(/user\/(\d+)/);
                id = id && id[1] || '';

                str = str.replace(getRegExp(n.ref), '<a href="' + (id != '' ? '/st/user/' + id : n.src) + '" ' + (id != '' ? '' : 'target="_blank"') + '>' + n.text + '</a>');
            });
        if(ext.audio)
            $.each(ext.audio, function (i, n) {
//                str = str.replace(getRegExp(n.ref), '');
                str = str.replace(getRegExp(n.ref), getAudio(n.src));
            });
        if(ext.dictAudio)
            $.each(ext.dictAudio, function (i, n) {
//                str = str.replace(getRegExp(n.ref), '');
                str = str.replace(getRegExp(n.ref), getDictAudio(n.audioSrc, n.urlSrc, n.text));
            });
        if(ext.video)
            $.each(ext.video, function (i, n) {
//                str = str.replace(getRegExp(n.ref), '');
                str = str.replace(getRegExp(n.ref), getVideo(n.src));
            });
        if (ext.answerTime){
             $.each(ext.answerTime, function (i, n) {
//                str = str.replace(getRegExp(n.ref), '');
                str = str.replace(getRegExp(n.ref), '<div style="font-size:12px;color: #999">用时:'+n.text+'</div>');
            });
        }
        return str;
    },
    //表情大小重设
    resetFaceSize:function(html) {
        html=html||$('body');
        var resize=function(obj){
            var src=obj.src,code;
            src = src.split('/');
            code = src[src.length - 1].split('.')[0].split('_')[0];
            if (code >= 119 && code <= 223) {
                //qq表情
                $(obj).css({width: 24,height: 24});
            }else{
                $(obj).css({width: 40,height: 40});
            }
        };

        html.find('img').each(function () {
            var self = this;
            if ($(self).hasClass('img_reset_size')) return;

            $(self).addClass('img_reset_size');
            if (this.src.indexOf('/plugins/emoticons/images/2014') != -1) {
                if (this.complete) {
                    resize(self);
                } else {
                    this.onload = function () {
                        resize(self);
                    }
                }
            }
        });
    },
    //图片地址格式化
    imageFormat:function(url,width,height,format,style){
        style=style||1;
        width=width||0;
        height=height||0;
        format=format||'jpg'
        if(!url) return '';
        url = url.replace('http://i3.s.yun.hjfile.cn', 'http://i3.s.7.hjfile.cn');
        url = url.replace('http://i3.s.7.hjfile.cn/entry/', 'http://i3.s.7.hjfile.cn/img/entry/');
        url = url.replace('http://i3.s.hjfile.cn/entry/', 'http://i3.s.7.hjfile.cn/img/entry/');
        return url+'?imageView2/'+style+'/w/'+width+'/h/'+height+'/format/'+format
    },
    scoreFormat:function(num,format){
        if(isNaN(num) || !num) return '<span class="score_num_b">0<span>';
        num=num.toFixed('2').toString().split('.');
        format=format||'html';
        if(format=='html'){
            return '<span class="score_num_b">'+num[0]+'.</span><span class="score_num_s">'+num[1]+'%</span>'
        }else{
            return {
                b:num[0],
                s:num[1]
            }
        }
    },
    numberFormat:function(num,dot){
        dot=dot||1;
        if(isNaN(num=parseInt(num))) return 0..toFixed(dot);
        return num>=10000?((num/10000).toFixed(dot)+'万'):num;
    }

});
//水平滚动组件
$.extend($.fn, {
    overSlides: function (callback) {
        $(this).each(function () {
            $(this).overSlide(callback);
        })
    },
    //整体滚动
    overSlide: function (options,callback) {
        var $this = $(this),
            $parent = $this.parent(),
            $child = $this.children(),
            wrapWidth = $parent.outerWidth(true),
            wrapPadding=parseInt($this.css('padding-left')) + parseInt($this.css('padding-right')),
            childsWidth=0,
            minMove = 1,
            defaultOptions={
                move:true,
                padding:20
            };

        if($.type(options)=='function'){
            callback=options;
            options={};
        }else {
            options=$.extend(true,defaultOptions,options);
        }
        childsWidth+=options.padding;
        $child.each(function(){
            childsWidth+=$(this).outerWidth(true);
        });
        childsWidth+=wrapPadding;

        var _bindEvent = function () {
            var starty=startX=dx=dy=endTy=endTx= 0,
                oldDate;
            $this.addClass('bindedEvent').css('width', childsWidth);
            $parent.on('touchstart', function (e) {
                oldDate=new Date();
                starty = e.originalEvent.touches[0].clientY;
                startX = e.originalEvent.touches[0].clientX-$this.offset().left;
            });
            $parent.on('touchmove', function (e) {
                endTy = e.originalEvent.touches[0].clientY || e.originalEvent.changedTouches[0].clientY;
                endX = e.originalEvent.touches[0].clientX || e.originalEvent.changedTouches[0].clientX;

                dx = Math.abs(endX - startX);
                dy = Math.abs(endTy - starty);
                //竖向拖动不阻止默认事件
                if ((dy > dx || dy > 10 ) || dx < minMove) {
                    return;
                }
                event.preventDefault();
                dx= endX - startX;
                dy=endTy - starty;
                if(options.move!==false){
                    $.setTransitionTime($this, 0);
                    $.translate3d($this, dx);
                }
            });

            $parent.on('touchend', function (e) {
                var newDate=new Date();
                if((dx<12 || dx>-12) &&(dy>-12 || dy<12) && newDate-oldDate<200 && options.tap){
                    oldDate = newDate;
                    $parent.trigger('tap');
                }
                var offleft = $this.offset().left;
                $.setTransitionTime($.this, 0.3);
                if (offleft > 0) {
                    $.translate3d($this, 0);
                }
                if (offleft < -(childsWidth - wrapWidth)) {
                    $.translate3d($this, -(childsWidth - wrapWidth));
                }
                callback && callback(dx, dy);
                dx=0;
                dy=0;
            });
        }
        if ($this.hasClass('bindedEvent')) {
            return;
        }

        if (childsWidth > wrapWidth) {
            _bindEvent();
        }
        return {
            destory: function () {
                $this.removeClass('bindedEvent');
                $parent.off();
            },
            reset: function () {
                childsWidth=0;
                wrapWidth=$this.parent().outerWidth(true);
//                if(wrapWidth>screen.availWidth)
//                    wrapWidth=screen.availWidth;
                $this.children().each(function(){
                    childsWidth+=$(this).outerWidth(true);
                });
                childsWidth+=wrapPadding+options.padding;
                $this.css('width', childsWidth);
            },
            moveTo: function (num) {
                var moveX=0;
                $this.children().each(function(i){
                    if(num-i>0){
                        moveX+=$(this).outerWidth(true);
                    }
                });
                if(-moveX< -(childsWidth - wrapWidth)){
                    moveX=childsWidth - wrapWidth;
                }
                $.setTransitionTime($this, 0);
                $.translate3d($this, -moveX);
                oldX=-moveX;
            }
        }
    },
    //单个滚动
    slideBanner:function(pageObj,autoscroll){
        var slideObj=$(this),
            $child =$(this).children(),
            slideWidth = $child.outerWidth(true),
            countPage = $child.length,
            slideCurPage= 1,
            returnObj,
            timeout;
        $child.css('width',$child.outerWidth(true));
        pageObj.eq(0).addClass('active').siblings().removeClass('active');

        function autoScrollBanner(){
            if(autoscroll!==0){
                clearInterval(timeout);
                timeout=setInterval(function(){
                    turnPage(-21);
                },autoscroll);
            }
        }

        var turnPage=function(dx){

            if (dx > 20) {
                slideCurPage -= 1;
                slideCurPage = slideCurPage == 0 ? countPage : slideCurPage;
            } else if (dx < -20) {
                slideCurPage += 1;
                slideCurPage = slideCurPage > countPage ? 1 : slideCurPage;
            }

            $.translate3d(slideObj, -(slideCurPage - 1) * slideWidth);
            pageObj.eq(slideCurPage - 1).addClass('active').siblings().removeClass('active');
            //            console.log(slideCurPage,countPage,dx);
            autoScrollBanner();
        };

        returnObj=$(this).overSlide({move:false,tap:true},function(dx){
            turnPage(dx);
        });

        autoScrollBanner();


        return {
            next:function(){
                turnPage(-21);
            },
            prev:function(){
                turnPage(21);
            }
        };
    }
});


$.extend($,{
    //检测网络
    checkNetwork: function () {
//        if (navigator.onLine) {
//            return true;
//        } else {
//            $.toast('您的网络不太给力哦~', 500);
//            return false;
//        }
        return true;
    },
    serverError: function () {
        $.toast('服务器忙，请稍候再试~', 500);
    },
    isRetina: function () {
        return window.devicePixelRatio && window.devicePixelRatio >= 1.5;
    },
    uniqID: function (string) {
        string = string || '';
        return string + Math.random().toString(36).substr(2, 10);
    },
    isWeixin: function () {
        return /MicroMessenger/i.test(navigator.userAgent);
    },
    isIOS: function () {
        return /ipad|iphone|iPod|Macintosh|mac os/i.test(navigator.userAgent);
    },
    isAndroid: function () {
        return /Android/i.test(navigator.userAgent);
    },
    isMobile:function(m){
        return /^1[3,5,7,8]\d{9}$/.test(m);
    },
    userID2Face: function (userId, size,style) {
        userId=(userId||0).toString();
        var len = userId.length,
            str = "0000";
        size = size || 96;
        if(userId==0){
            if(style){
                return '/st/images/defaultuser.png';
            }else{
                return '/st/images/default_head.png';
            }
        }
        if (len < 4) {
            userId = str.substr(0, (4 - len)) + userId;
            len = 4;
        }
        return "http://i2.hjfile.cn/f" + size + "/" + userId.substr(len - 4, 2) + "/" + userId.substr(len - 2, 2) + "/" + userId + ".jpg";
    },
    charLen: function (string) {
        if (!string) return 0;
        return string.replace(/[^\x00-\xff]/g, '00').length;
    },
    setCache:function(key,value,exp){
        //过期时间默认1天
        exp=exp||86400;
        if(!value){
            st.cache[key+'_'+curUserID] = null;
            store.delete(key+'_'+curUserID);
            return false;
        }

        st.cache[key+'_'+curUserID] = value;
        store.set(key+'_'+curUserID, value, {exp:exp});
    },
    getCache:function(key){
        return (st.cache[key+'_'+curUserID] || store.get(key+'_'+curUserID));
    },
    checkUser:function(checkActive,checkLogin){
        //bl :帐户激活检测
        checkLogin=checkLogin||0;
        if(curUserID==0 && !checkLogin){
            $.login();
            return false;
        }
        if(st.userInfo.locked){
            $.toast('您的帐户被锁定，请联系管理员。');
            return false;
        }
        if(checkActive && st.userInfo.userGroupId==5){
            $.activeAccount();
            return false;
        }
        return true;
    },
    isShowHeader:function(){
        var sourceIds={
                '21':'沪江大APP',
                '22':'沪江大APP',
                '23':'听力酷(社团版)',
                '24':'听力酷(社团版)',
                '25':'沪江开心词场',
                '26':'沪江开心词场',
                '27':'沪江小D词典',
                '28':'沪江小D词典',
                '29':'新概念英语',
                '0':'PC',
                '1':'触屏',
                '1000':'触屏微信',
                '30':'反馈IOS',
                '31':'反馈Android',
                '33':'沪江网校',
                '34':'沪江网校',
                '35':'网站专题'
            },
            hideHeaderScourceIDs={
                '25':'沪江开心词场',
                '26':'沪江开心词场',
                '27':'沪江小D词典',
                '28':'沪江小D词典',
                '1000':'触屏微信'
            };
        if(hideHeaderScourceIDs[sourceID]){
            return false;
        }else{
            return true;
        }
    },
    isHJWebViewApp:function(sid){
        sid=sid||sourceID;
        var hideHeaderScourceIDs={
            '25':'沪江开心词场',
            '26':'沪江开心词场',
            '27':'沪江小D词典',
            '28':'沪江小D词典'
        };
        if(hideHeaderScourceIDs[sid]){
            return true;
        }else{
            return false;
        }
    },
    isHJWebViewApp2:function(sid){
        sid=sid||sourceID;
        var hideHeaderScourceIDs={
            '25':'沪江开心词场',
            '27':'沪江小D词典'
        };
        if(hideHeaderScourceIDs[sid]){
            return true;
        }else{
            return false;
        }
    },
    checkFooter: function () {
        var screenHieght = $(window).height(),
            footerHeight = $('#footer').height(),
            documentHeight = $('#content').height(),
            fixBottomHeight = $('.fixed_bottom').height();
        if ($('.fixed_bottom').length) {
            documentHeight+=fixBottomHeight;
            $('#footer').css('margin-bottom', fixBottomHeight);
        } else {
            $('#footer').css('margin-bottom', 0);
        }
        if (screenHieght - footerHeight >= documentHeight) {
            $('#mainPage').addClass('fixFooter');
        } else {
            $('#mainPage').removeClass('fixFooter');
        }
        window.HJApp && appGetPageTitle();
    },
    checkHeader:function(opt){
        if(!$.isShowHeader() && !opt){
            $('.header').hide();
        } else{
            $('.header').show();
        }
    },
    checkPage:function(opt){
        $.checkHeader(opt);
        $.checkFooter();
    },
    setShareWeixinInfo:function(options){
        var title=options.title,
            summary=options.summary,
            link=options.link||location.href,
            callback=options.callback,
            pic=options.pic||'http://ms.hujiang.com/st/images/icon114.png';

        st.cache['shareImg']=pic;
        st.cache['shareSummary']=summary;
        st.cache['shareTitle']=title;
        st.cache['shareLink']=link;

        var key = "st_topic_d_weixin";
        shareLink = "http://channel.hujiang.com/ch_click.aspx?ch_source=" + key + "_share_weixin&page=" + encodeURIComponent(link);
        var wx_data = {
            title: "推荐：" + title, // 分享标题
            desc: summary, // 分享描述
            link: shareLink, // 分享链接
            imgUrl:pic, // 分享图标
            success: function (res) {
                // 用户确认分享后执行的回调函数
                callback && callback(res);
            },
            cancel: function (res) {
                // 用户取消分享后执行的回调函数
            }
        };
        wxshare.reset(wx_data);
    },
    shareQQAddress:function(title,summary){
        return 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url='+encodeURIComponent('http://channel.hujiang.com/ch_click.aspx?ch_source=st_qq&page='+location.href)
            +'&showcount=0&summary='+encodeURIComponent(summary)+'&desc='+encodeURIComponent(summary)
            +'&title='+encodeURIComponent(title)+'&site='+encodeURIComponent('沪江社团')
            +'&pics='+encodeURIComponent('http://ms.hujiang.com/st/images/icon114.png')
    },
    shareWeiboAddress:function(title){
        var url=escape('http://channel.hujiang.com/ch_click.aspx?ch_source=st_weibo&amp;page='+location.href);
        return 'http://service.weibo.com/share/share.php?url='+url
            +'&type=icon&language=zh_cn&title='+encodeURIComponent(title+'（阅读原文：'+location.href+'，下载沪江手机客户端：http://hj.vc/vrjU3vJ）')
            +'&searchPic=http://ms.hujiang.com/st/images/icon114.png&style=simple'
    },
    parseURL:function(url) {
        var a =  document.createElement('a');
        a.href = url;
        return {
            source: url,
            protocol: a.protocol.replace(':',''),
            host: a.hostname,
            port: a.port,
            query: a.search,
            params: (function(){
                var ret = {},
                    seg = a.search.replace(/^\?/,'').split('&'),
                    len = seg.length, i = 0, s;
                for (;i<len;i++) {
                    if (!seg[i]) { continue; }
                    s = seg[i].split('=');
                    ret[s[0]] = s[1];
                }
                return ret;
            })(),
            file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
            hash: a.hash.replace('#',''),
            path: a.pathname.replace(/^([^\/])/,'/$1'),
            relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
            segments: a.pathname.replace(/^\//,'').split('/')
        };
    },
    weixinRedEnvelope:function(options){
        $('#showInWeixinTip').hide();
        var opt={
            entityID:options.id,
            title:options.title,
            url:options.url,
            sourceID:1000
        };
        if (options.res.errMsg=="sendAppMsg:ok") {
            //微信好友
            opt.shareType = 1;
        }else if (options.res.errMsg=="shareTimeline:ok") {
            //微信朋友圈
            opt.shareType = 2;
        }
        $.sync({
            url: '/v1/share/topic',
            data: opt,
            type: 'post',
            success: function (d) {
                options.obj.append(fundTip(d));
                options.obj.on('tap','.share-success-overlayer',function(){
                    $(this).fadeOut();
                }).on('tap','.tip4',function(e){
                    $.changePage($(e.currentTarget).attr('data-link'));
                });

            }
        });
        $.customEvent('触屏分享成功');
    },
    setWeixinTitle:function(title){
        document.title=title;
        // hack在微信IOS webview中无法修改document.title的情况
        if($.isWeixin() && $.isIOS()) {
            var $iframe = $('<iframe src="/st/images/icon144.png"></iframe>');
            $iframe.on('load', function () {
                setTimeout(function () {
                    $iframe.off('load').remove();
                }, 0);
            }).appendTo('body');
        }
    },
    checkWeixinAudio:function(callback){
        var ua=navigator.userAgent,
            ver=ua.match(/MicroMessenger\/([\d\.]+)/i);
        ver= ver && ver[1];
        if($.isAndroid() && ver<6.2){
            initWeixin(function(){
                callback && callback();
            });
        }else{
            callback && callback();
        }
    }
});


$.extend($, {
    translate3d: function (obj, x, y, z) {
        x = x || 0, y = y || 0, z = z || 0;
        $(obj).css({
            '-webkit-transform': 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)',
            '-moz-transform': 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)',
            'transform': 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)'
        });
    },
    setTransitionTime: function (obj, num) {
        $(obj).css({
            '-webkit-transition': +num + 's',
            '-moz-transition': +num + 's',
            'transition': +num + 's'
        });
    },
    toast: function (msg,interval,site) {
        /* site位置如下：默认为5
        *  1,2,3
        *  4,5,6
        *  7,8,9
        * */
        msg || (msg = '');
        site=site||5;
        var id = $.uniqID(),
            msg = $('<div class="toast_info_box hide toast_info_box_site'+site+'" id="' + id + '"><span class="error_msg">' + msg + '</span></div>');
        $('body').append(msg);
        $('#' + id).fadeIn();
        var close=function(){
            $('#' + id).fadeOut();
            setTimeout(function () {
                $('#' + id).remove();
            }, 500);
        }

        if(interval!==false)
            setTimeout(function () {
                close();
            }, interval || 2000);

        return{
            close: function () {
                close();
            }
        };
    },
    //载入更多内容
    loadMoreData: function (options) {
        var defaultSetting = {
                loading: '.loading',
                padding: 200,
                url: '',
                loadFirstPage: false,
                data: {
                    start: 1,
                    limit: 10,
                    pageType:1
                },
                success: function () { },
                error: null
            },
            opt = $.extend(true, defaultSetting, options),
            isRetina = $.isRetina(),
            windowHeight = $(window).height(),
            loading = false,
            uniqID = $.uniqID(),
            curPage = opt.data.start;

        function loadData() {
            opt.data.start=curPage;
            var data = {
                url: opt.url,
                type: 'get',
                contentBox:'',
                data: opt.data,
                success: function (d) {
                    var hasMore = true;
                    if (!d || Math.ceil(d.totalCount / opt.data.limit) <= curPage) {
                        $(window).off('scroll.' + uniqID);
                        hasMore = false;
                    }
                    curPage += 1;
                    loading = false;
                    opt.success(d, hasMore);
                },
                error: function (d) {
                    opt.error && opt.error(d);
                    $(window).off('scroll.' + uniqID);
                },
                loading: opt.loading
            };
            $.sync(data);
        }

        if (opt.loadFirstPage) {
            loading = true;
            loadData();
        }
        $(window).on('scroll.' + uniqID, function () {
            var offset = document.body.scrollTop;
            if (offset + windowHeight+opt.padding > $content.height() && !loading) {
                loading = true;
                loadData();
            }
        });
        return {
            destory: function () {
                $(window).off('scroll.' + uniqID);
            }
        };
    },
    //没有更多列表统一处理
    hasNotMoreData:function(obj,hasData,notDataText){
        if(hasData){
            obj.append('<div class="has_not_data">'+(notDataText||'暂无数据')+'</div>');
        }else{
            obj.append('<div class="has_not_more_topic">没有更多了</div>');
            setTimeout(function(){
                obj.find('.has_not_more_topic').fadeOut();
            },3000);
        }
        $.checkFooter();
    },
    //输入框textarea滚动
    textAreaScroll: function (obj) {
        var start = 0;
        $(obj).on('touchstart', function (e) {
            start = e.originalEvent.touches[0].clientY;
        }).on('touchend', function (e) {
            var end = e.originalEvent.changedTouches[0].clientY;
            if (end > start) {
                $(obj)[0].scrollTop -= 30;
            }
            else {
                $(obj)[0].scrollTop += 30;
            }
        }).on('touchmove', function (e) {
            e.preventDefault();
        });
    },
    //滚动到指定元素
    scrollTo: function (obj) {
        if (typeof obj === "number") {
            window.scroll(0,obj);
        }
        else {
            var offset = $(obj).offset();
            window.scroll(0,offset.top);
        }
    },
    openAPP: function (appAddress, iosDownload, androidDownload) {
//        if (!/mx4/i.test(navigator.userAgent))
//            window.location = appAddress;
//        setTimeout(function () {
//            window.location = iosDownload;
//            //                window.location= $.isAndroid()?androidDownload:iosDownload;
//        }, 10);


        window.location=appAddress;
        var startDate=new Date();
        setTimeout(function(){
            if(new Date()-startDate>1000) return;
            window.location= $.isAndroid()?androidDownload:iosDownload;
        },800);
    },
    setCursorPosition: function (htmlTag, start, end) {
        if (start === undefined) start = htmlTag.value.length;
        if (end === undefined) end = htmlTag.value.length;
        if (htmlTag.setSelectionRange) { //W3C
            setTimeout(function () {
                htmlTag.setSelectionRange(start, end);
//                    htmlTag.focus();
            }, 0);
        } else if (htmlTag.createTextRange) { //IE
            var textRange = htmlTag.createTextRange();
            textRange.moveStart("character", start);
            textRange.moveEnd("character", end);
            textRange.select();
        }
    },
    getLimitString: function (str, limit) {
        var pos = 0;
        if (!limit || $.charLen(str) <= limit) return str;
        for (var i = 0; i < str.length; i++) {
            pos += str.charCodeAt(i) > 255 ? 2 : 1;
            if (limit <= pos) {
                return str.substr(0, i + 1)+'...';
                break;
            }
        }
    },
    changePage: function (hash_path,replace) {
        st.router.navigate(hash_path, {trigger:true,replace:replace});
//        window.scroll(0,0);
    },
    praiseAnimate:function(obj,ajaxUrl,callback){
        var praiseNumObj=obj.find('.praise_num');
        if($.checkUser()) {
            $.sync({
                url: ajaxUrl,
                type: 'post',
                success: function () {
                    var praiseNum=parseInt(praiseNumObj.text());
                    praiseNum=isNaN(praiseNum)?0:praiseNum;
                    praiseNumObj.text(praiseNum + 1);
                    obj.addClass('animate_praise').append('<span class="praise_add_one">+1</span>');
                    setTimeout(function () {
                        obj.find('.praise_add_one').remove();
                    }, 1500);
                    callback && callback();
                },
                error: function (d) {
                    if (d.status == -7340064) {
                        if(praiseNumObj.length) {
                            praiseNumObj.text('已赞');
                        }else{
                            $.toast('您已经点过赞了~');
                        }
                    } else {
                        $.toast(d.message);
                    }
                }
            });
        }
    },
    popWindow:function(options){
        var defaultOptions={
                title:'',
                content:'',
                yes:'确认',
                no:'',
                uniqID:$.uniqID(),
                type:1,
                closeBtn:false,
                tapMask:false,
                callback: $.noop()
            },
            opt={},
            win;
        opt= $.extend(defaultOptions,options);
        if(opt.type==1) opt.no=opt.no||'取消';
        win=$(popWindow(opt));
        $('body').append(win).on('tap.popWindow'+opt.uniqID,'.yes_btn,.no_btn,.pop_window_wrap',function(e){
            var pos=false,
                obj=$(e.target),
                obj2=$(e.currentTarget);

            if(obj.hasClass('pop_window_wrap') && opt.tapMask){
                win.remove();
                $('body').off('tap.popWindow'+opt.uniqID);
                return false;
            }
            if(obj2.hasClass('yes_btn') || obj2.hasClass('no_btn') ) {
                if (obj2.hasClass('yes_btn')) {
                    pos = true
                }
                if ($.type(opt.callback) == 'function') {
                    if (opt.callback(pos) !== false) {
                        win.remove();
                        $('body').off('tap.popWindow'+opt.uniqID);
                    }
                } else {
                    win.remove();
                    $('body').off('tap.popWindow'+opt.uniqID);
                }
            }
        });
    },
    joinLeague:function(leagueID,leaguType,tips,callback){
        if(!$.checkUser()){
            return false;
        }
        if($.type(tips)=='function'){
            callback=tips;
            tips=false;
        }
        if(!tips){
            $.joinLeagueAction(leagueID,leaguType,callback);
            return false;
        }
        $.popWindow({
            content:'需要您先加入社团才可操作哦~',
            yes:'加入社团',
            no:'取消',
            type:2,
            callback:function(bl){
                if(bl){
                    $.joinLeagueAction(leagueID,leaguType,callback);
                }
            }
        });
    },
    joinLeagueAction:function(leagueID,leaguType,callback){
        if(leaguType==0){
            $.popWindow({
                title:'入社申请',
                content:'<textarea id="joinLeagueReason" maxlength="200" placeholder="填写加入社团的理由"></textarea>',
                yes:'申请',
                no:'取消',
                callback:function(bl){
                    if(bl){
                        var reason= $.trim($('#joinLeagueReason').val());
                        if(reason==''){
                            $.toast('请填写加入社团的理由');
                            return false;
                        }
                        if($.charLen(reason)>200){
                            $.toast('理由长度不能超过200字符');
                            return false;
                        }
                        $.joinLeagueAction2(leagueID,$('#joinLeagueReason').val(),function(){
                            $.toast('申请已经提交,请等待审核');
                            callback && callback();
                        });
                    }
                }
            });
        }else{
            $.joinLeagueAction2(leagueID,'',function(){
                $.toast('您已成功加入社团');
                callback && callback();
            });
        }
    },
    joinLeagueAction2:function(leagueID,reason,callback){
        $.sync({
            url:'/v1/league/'+leagueID+'/join',
            data:{reason:reason},
            type:'post',
            success:function(){
                callback && callback();
            }
        });
    },
    login:function(){
        //不做微信区分
//        if($.isWeixin()){
//            location.href=st.cfg.passport+'/m/wx/default.aspx?appid=1000&url='+decodeURIComponent(location.href);
//        }else{
            location.href=st.cfg.passport+'/m/login/?url='+decodeURIComponent(location.href);
//        }
    },
    shareWeixinTip:function(){
        var html=$(showWeixinTip());
        $('body').append(html);
        html.on('tap',function(e){
            var obj=$(e.target);
            if(obj.hasClass('btn_login')){
                $.login();
            }
            html.remove();
        });
    },
    activeAccount:function(){
        $.popWindow({
            content:'您的帐户还未激活哦，绑定手机号激活吧',
            yes:'去绑定',
            no:'取消',
            type:2,
            callback:function(bl){
                if(bl){
                    $.changePage('/st/user/active/');
                }
            }
        });
    },
    customEvent:function(name,data){
        if(data){
            data.curPage=location.href;
            data.sourceID=sourceID;
            data.referrer=document.referrer;
            data.userID=curUserID;
        }else{
            data={
                curPage:location.href,
                sourceID:sourceID,
                referrer:document.referrer,
                userID:curUserID
            };
        }
        window.ht && ht.sendCustomEvent(name,data);
    },
    setFriendly:function(e,userID){
        var obj= $(e.currentTarget);

        if(obj.find('.friend_status_down_box').length){
            if($(e.target).closest('.friend_status_down_box').length) return;
            obj.removeClass('friend_status_down').find('.friend_status_down_box').remove();
            return ;
        }
        obj.addClass('friend_status_down').append('<div class="friend_status_down_box"></div>');
        var friendlyBox= require('../../views/common/friendly/friendly');
        new friendlyBox({el:obj.find('.friend_status_down_box'),userID:userID});
    }
});


/*
 * $.sync(options)
 * options: {
 *   url:''
 *   type:'get/post/put/delete'
 *   success:fn
 *   error:fn
 *   data:{}
 *   loading:selector
 * }
 * */
$.extend($, {
    sync: function (options) {
        var defaultSetting = {
            checkNetwork: true,
            timeout: 20000
        };
        var opt = $.extend(true, defaultSetting, options),
            type = (opt.type || 'get').toLowerCase(),
            data = opt.data;
//        data.sourceID=$.isWeixin()?1000:1;
        if (type == 'get' && data) {
            opt.url +=(opt.url.indexOf('?')>0?'&':'?')+$.param(data);
        }
        if (!opt.checkNetwork || (opt.checkNetwork && $.checkNetwork())) {
            var data = {
                url: opt.url,
                type: type,
                data: data
            };
            if(opt.loading) $(opt.loading).show();
            $.ajaxBatch([data], function (d) {
                if(opt.loading) $(opt.loading).hide();
//                $.checkFooter();
                if (d.status == 0) {
                    opt.success && opt.success(d.data);
                } else if (opt.error && $.type(opt.error) === 'function') {
                    opt.error(d);
                } else {
                    $.toast(d.message, 500);
                }
            });
        }
    }
});


/*
* 图片上传组件
* $('.add_photo_btn').Mobile_upload({
     multiple:true,
     ajax:{
     url:'/soa/v1/upload_img'
 },
 callback:function(result,name,postName){
     photo[name.lastModified]=result;
     self._showThumbnail(name.lastModified)
 }
 });
* */
(function() {
    $.fn.Mobile_upload = function (settings) {
        var list = [];
        $(this).each(function () {
            var upload = new Mobile_upload();
            var options = $.extend({
                target: $(this)
            }, settings);
            upload.init(options);
            list.push(upload);
        });
        return list;
    };


    function Mobile_upload() {
        window.uploadCount = window.uploadCount || 0;
        window.uploadCount++;
        var rnd = Math.random().toString().replace('.', '');
        this.id = 'upload_' + rnd + window.uploadCount.toString();
        this.fileInput = null;
    }

    Mobile_upload.prototype = {
        init: function (settings) {
            this.settings = $.extend({}, this.settings, settings);
            this.target = this.settings.target;
            this.createFile();
            this.name = this.settings.name || "files";
            this.bindEvent();
            this.bindFileChange();
        },
        touch: function (obj, fn) {
            var move;
            $(obj).on('click', click);

            function click(e) {
                return fn.call(this, e);
            }

            $(obj).on('touchmove', function (e) {
                move = true;
            }).on('touchend', function (e) {
                e.preventDefault();
                if (!move) {
                    var returnvalue = fn.call(this, e, 'touch');
                    if (!returnvalue) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
                move = false;
            });
        },
        createFile: function () {
            var _this = this;
            _this.fileInput && _this.fileInput.remove();
            _this.fileInput = $('<input type="file" style="position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;"  accept="image/*" id="' + _this.id + '"/>');
            $(_this.target).after(_this.fileInput);
            if (this.settings.multiple) {
                this.fileInput.attr('multiple', 'multiple');
            }
            this.bindFileChange();
        },
        bindEvent: function (e) {
            var _this = this;
            this.touch($(this.target), function (e, t) {
                if ($(this).parent().siblings().size() >= _this.settings.max) {
                    _this.settings.maxCallback && _this.settings.maxCallback(this);
                } else {
                    $(_this.fileInput).trigger('click');
                }
                return false;
            });
            _this.bindFileEvent();
        },
        bindFileEvent: function () {
            var _this = this;
            $(this.fileInput).click(function (e) {
                e.stopPropagation();
            });
        },
        bindFileChange: function () {
            var _this = this;
            $(_this.fileInput).off('change');
            $(_this.fileInput).on('change', function (e) {
                var reg_type = /^image\//i;
                var files = e.target.files;
                if (_this.settings.iframe) {
                    //ifrmae post
                    var key = "up_" + Math.random().toString().replace('.', '');
                    if (_this.postFrame(this, e, key)) {
                        _this.settings.startUpload && _this.settings.startUpload(_this.fileInput, _this.target, key);
                    }
                } else if (files) {
                    for (var i = files.length - 1; i >= 0; i--) {
                        var file = files[i];
                        (function (file) {
                            if(file.size> _this.settings.maxFileSize){
                                $.toast('您上传的图片尺寸过大，最大限制为9M');
                                return false;
                            }
                            var key = "key_" + Math.random().toString().replace('.', '');
                            var rnd = Math.random().toString().replace('.', '');
                            var i = 'up_' + rnd;
                            //有些安卓手机无法获取文件类型
                            if (reg_type.test(file.type) || !file.type) {
                                if ($('#' + _this.id).parent().siblings().size() + 1 >= _this.settings.max) {
                                    _this.settings.maxCallback && _this.settings.maxCallback($('#' + _this.id));
                                }
                                if (window.FileReader) {
                                    var reader = new FileReader();
                                    _this.settings.startUpload && _this.settings.startUpload(_this.fileInput, _this.target, i);
                                    reader.onload = function () {
                                        //清除缓存
                                        _this.createFile();
                                        _this.bindFileEvent();
                                        _this.settings.imageReady && _this.settings.imageReady(_this.fileInput, _this.target, this.result, i);
                                        if (_this.settings.ajax) {
                                            var data = {};
                                            data[_this.settings.ajax.name || 'file'] = this.result;
                                            _this.settings.ajax.loading && _this.settings.ajax.loading.show();
                                            $.ajax({
                                                type: 'post',
                                                url: _this.settings.ajax.url,
                                                data: data,
                                                dataType: 'json',
                                                success: function (result) {
                                                    _this.settings.ajax.loading && _this.settings.ajax.loading.hide();
                                                    if (_this.settings.callback) {
                                                        _this.settings.callback(result, file, _this.name, _this.target, i);
                                                    }
                                                },
                                                complete: function () {
                                                    _this.settings.ajax.loading && _this.settings.ajax.loading.hide();
                                                    _this.settings.endUpload && _this.settings.endUpload(_this.fileInput, _this.target, i);
                                                }
                                            });
                                            this.result = null;
                                            reader.onload = null;
                                            reader = null;
                                        } else if (_this.settings.callback) {
                                            _this.settings.callback(this.result, file, _this.name, _this.target, i);
                                        }
                                    };
                                    reader.readAsDataURL(file);
                                }
                            } else {
                                $.toast("不是图片文件");
                                // break;
                            }
                        })(file)
                    }
                }
            });
        }
    };
}());

(function () {

    var videoApi = 'http://api.site.hujiang.com/Web/VideoV1.ashx';

    function videoRenderModel(embedTarget, video) {
        $(embedTarget).replaceWith(video);
        return video;
    }

    function tudou(target) {
        $.ajax({
            url: videoApi,
            data: {
                op: 'GetVideoSrc',
                vurl: $(target).attr('data-src')
            },
            dataType: 'jsonp',
            success: function (data) {
                var mheight = document.body.clientWidth * (9 / 16) + "px",
                    mwidth = (document.body.clientWidth - 32) + "px",
                    temc = data.Value.match(/&code=([^&]*)/),
                    code = (temc && temc.length > 1) ? temc[1] : "",
                    temLcode = data.Value.match(/&code=([^&]*)/),
                    lcode = (temLcode && temLcode.length > 1) ? temLcode[1] : "",
                    temResourceId = data.Value.match(/&resourceId=([^&]*)/)[1],
                    resourceId = (temResourceId && temResourceId.length > 1) ? temResourceId[1] : "";
                videoRenderModel(target, $("<iframe src='http://www.tudou.com/programs/view/html5embed.action?type=2&code=" + code + "&lcode=" + lcode + "&resourceId=" + resourceId + "' allowtransparency='true' allowfullscreen='true' scrolling='no' border='0' frameborder='0' style='width:" + mwidth + ";height:" + mheight + "'></iframe>"));
            },
            error: function (error, stat) {
//                console.log(error);
            }
        });
    }

    function youku(target) {
        var videoId = $(target).attr('data-src').match("sid/([^/]*)")[1],
            uniqID = $.uniqID();
        var tempContainer = $("<div style='' id='" + uniqID + "'></div><p style='height:0;overflow:hidden'>");
        $("body").append(tempContainer);
        videoRenderModel(target, tempContainer);
        $('#' + uniqID).css({height: document.body.clientWidth * (9 / 16), width: document.body.clientWidth - 32});
        setTimeout(function(){
            if(window.YKU && YKU.Player) {
                new YKU.Player(uniqID, { styleid: 0, client_id: 'b051e0b225e7051b', vid: videoId });
            }else{
                var ykujs=$('<script></script>').appendTo('body');
                ykujs.attr('src','http://player.youku.com/jsapi');
                ykujs.on('load',function(){
                    setTimeout(function(){
                        new YKU.Player(uniqID, { styleid: 0, client_id: 'b051e0b225e7051b', vid: videoId });
                    },1000)
                });
            }
        },800)

    }

    function yinyuetai(target) {
        $.ajax({
            url: videoApi,
            data: {
                op: 'GetVideoSrc',
                vurl: $(target).attr('data-src')
            },
            dataType: 'jsonp',
            success: function (data) {
                var mheight = document.body.clientWidth * (9 / 16) + "px",
                    mwidth = (document.body.clientWidth - 32) + "px",
                    videoImage = data.Value.split(',')[0],
                    videoUrl = data.Value.split(',')[1] || data.Value.split(',')[0];
                videoRenderModel(target, $("<video poster='" + videoImage + "' preload=\"none\" width='" + mwidth + "' height='" + mheight + "' controls='controls'><source src='" + videoUrl + "'type='video/mp4' >暂不支持此视频</source></video>"));
            },
            error: function (error, stat) {
//                console.log(error);
            }
        });
    }

    function aiqiyi(target) {
        window.Q = {
            PageInfo: {

            }
        };
        window._0 = ["\x6E\x61\x74\x69\x76\x65\x5F\x6A\x61\x76\x61\x5F\x6F\x62\x6A", "\x63\x6F\x6E\x63\x61\x74", "\x70\x75\x73\x68", "\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65", "\x75\x6E\x64\x65\x66\x69\x6E\x65\x64", "\x50\x61\x67\x65\x49\x6E\x66\x6F", "", "\x6C\x65\x6E\x67\x74\x68", "\x63\x68\x61\x72\x41\x74", "\x00", "\x69\x6E\x64\x65\x78\x4F\x66", "\x73\x75\x62\x73\x74\x72\x69\x6E\x67", "\x68\x65\x69\x67\x68\x74", "\x6F\x72\x69\x65\x6E\x74\x61\x74\x69\x6F\x6E", "\x77\x69\x64\x74\x68", "\x64\x65\x76\x69\x63\x65\x50\x69\x78\x65\x6C\x52\x61\x74\x69\x6F", "\x72\x6F\x75\x6E\x64", "\x73\x63\x72\x65\x65\x6E\x54\x6F\x70", "\x6F\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74", "\x5F", "\x73\x74\x61\x72\x74\x54\x69\x6D\x65", "\x67\x65\x74\x49\x74\x65\x6D", "\x6C\x6F\x63\x61\x6C\x53\x74\x6F\x72\x61\x67\x65", "\x72\x65\x6D\x6F\x76\x65\x49\x74\x65\x6D", "\x69\x71\x69\x79\x69", "\x73\x65\x74\x49\x74\x65\x6D", "\x72\x65\x66\x65\x72\x72\x65\x72", "\x62\x61\x69\x64\x75\x2E\x63\x6F\x6D", "\x55\x43\x57", "\x5F\x62\x6F\x6C\x75\x6F\x57\x65\x62\x56\x69\x65\x77", "\x42\x4F\x4C", "\x54\x55\x52\x4F\x61\x6B\x31\x71\x62\x47\x6C\x5A\x65\x6C\x6B\x77\x5A\x57\x4E\x68\x4E\x44\x4E\x6C\x59\x6D\x4A\x68\x4E\x54\x6B\x33\x4D\x57\x46\x6A\x59\x30\x31\x55\x61\x7A\x4E\x4F\x52\x46\x46\x33\x54\x30\x45\x39\x50\x51\x3D\x3D", "\x54\x55\x52\x4F\x61\x6B\x31\x71\x62\x47\x6C\x5A\x64\x7A\x30\x39\x56\x47\x31\x77\x55\x32\x4A\x47\x61\x33\x6C\x53\x56\x45\x4A\x4F\x54\x57\x78\x61\x63\x46\x64\x58\x4D\x55\x5A\x51\x55\x54\x30\x39\x56\x47\x78\x53\x63\x6B\x30\x77\x4D\x56\x68\x53\x62\x58\x42\x61\x5A\x48\x6F\x77\x4F\x51\x3D\x3D", "\x67\x65\x74\x54\x69\x6D\x65", "\x63\x61\x63\x68\x65", "\x73\x69\x6E", "\x61\x62\x73", "\x73\x75\x62\x73\x74\x72", "\x72\x65\x70\x6C\x61\x63\x65", "\x63\x68\x61\x72\x43\x6F\x64\x65\x41\x74", "\x66\x75\x6E\x63\x74\x69\x6F\x6E\x25\x32\x30\x6A\x61\x76\x61\x45\x6E\x61\x62\x6C\x65\x64\x25\x32\x38\x25\x32\x39\x25\x32\x30\x25\x37\x42\x25\x32\x30\x25\x35\x42\x6E\x61\x74\x69\x76\x65\x25\x32\x30\x63\x6F\x64\x65\x25\x35\x44\x25\x32\x30\x25\x37\x44", "\x6E\x75\x6C\x6C", "\x57\x65\x62\x6B\x69\x74\x41\x70\x70\x65\x61\x72\x61\x6E\x63\x65", "\x73\x74\x79\x6C\x65", "\x64\x6F\x63\x75\x6D\x65\x6E\x74\x45\x6C\x65\x6D\x65\x6E\x74", "\x6A\x61\x76\x61\x45\x6E\x61\x62\x6C\x65\x64", "\x73\x67\x76\x65", "\x73\x69\x6A\x73\x63", "\x6D\x64", "\x6A\x63", "\x64", "\x6A\x6F\x69\x6E", "\x55\x52\x4C", "\x3B", "\x3B\x26\x74\x69\x6D\x3D", "\x73\x72\x63", "\x64\x38\x34\x36\x64\x30\x63\x33\x32\x64\x36\x36\x34\x64\x33\x32\x62\x36\x62\x35\x34\x65\x61\x34\x38\x39\x39\x37\x61\x35\x38\x39", "\x73\x63", "\x5F\x5F\x72\x65\x66\x49", "\x71\x64\x5F\x6A\x73\x69\x6E", "\x71\x64\x5F\x77\x73\x7A", "\x74", "\x5F\x5F\x6A\x73\x54", "\x6A\x66\x61\x6B\x6D\x6B\x61\x66\x6B\x6C\x77\x32\x33\x33\x32\x31\x66\x34\x65\x61\x33\x32\x34\x35\x39", "\x5F\x5F\x63\x6C\x69\x54", "\x68\x35", "\x5F\x5F\x73\x69\x67\x43", "\x5F\x5F\x63\x74\x6D\x4D"];


        function weorjjigh(_27, _66) {
            if (_47(_0[0])) {
                native_java_obj = {}
            }
            ;
            var _7 = [];
            _9(_7, 44);
            _9(_7, 2 * 5);
            _9(_7, 0 - 2);
            _9(_7, -1 * 2);
            _9(_7, -25);
            _9(_7, 5 * -11);
            _9(_7, 40);
            _9(_7, -16);
            _9(_7, 51);
            _9(_7, -4);
            _7[_0[1]]([44, -38, 43, -53, -8]);
            h5vd_detective_url = true;
            function _9(_57, _55) {
                _57[_0[2]](_55)
            }
            ;
            var _33 = function (_16) {
                return btoa(_16)
            };
            var _2 = function (_16) {
                return atob(_16)
            };

            function _53(_59) {
                return (String[_0[3]](_59))
            }
            ;
            var _63 = function () {
                if (typeof Q != _0[4] && (typeof Q[_0[5]] != _0[4])) {
                    _22 = _0[6];
                    var _43 = _58(_67);
                    for (var _1 = _43[_0[7]] - 1; _1 >= 0; _1--) {
                        _22 += _43[_0[8]](_1)
                    }
                }
            };

            function _58(_37) {
                var _5 = new Array(2), _8 = _0[6], _1;
                var _28 = _36(_46, 4);
                var _31 = _46;
                for (_1 = 0; _1 < _37[_0[7]]; _1 += 8) {
                    _5[0] = _36(_37, _1);
                    _5[1] = _36(_37, _1 + 4);
                    _60(_5, _31, _28);
                    _8 += _44(_5[0]) + _44(_5[1])
                }
                ;
                if (_8[_0[10]](_0[9]) != -1) {
                    _8 = _8[_0[11]](0, _8[_0[10]](_0[9]))
                }
                ;
                return _8
            }
            ;
            function _60(_5, _31, _28) {
                var _12 = _5[0], _23 = _5[1];
                var _19 = _28 * 32;
                while (_19 != 0) {
                    _23 -= (_12 << 4 ^ _12 >>> 5) + _12 ^ _19 + _31[_19 >>> 11 & 3];
                    _19 -= _28;
                    _12 -= (_23 << 4 ^ _23 >>> 5) + _23 ^ _19 + _31[_19 & 3]
                }
                ;
                _5[0] = _12;
                _5[1] = _23
            }
            ;
            function _36(_8, _34) {
                return (((_8[_34]) + (_8[_34 + 1] << 8) + (_8[_34 + 2] << 16) + (_8[_34 + 3] << 24)) >>> 0)
            }
            ;
            function _44(_5) {
                var _8 = String[_0[3]](_5 & 0xFF, _5 >> 8 & 0xFF, _5 >> 16 & 0xFF, _5 >> 24 & 0xFF);
                return (_8)
            }
            ;
            var _15 = screen[_0[12]];
            if (window[_0[13]] === 90 || window[_0[13]] === -90) {
                _15 = _15 > screen[_0[14]] ? screen[_0[14]] : _15
            }
            ;
            var _30 = window[_0[15]];
            _15 = Math[_0[16]](_15 / _30);
            var _38 = Math[_0[16]](window[_0[17]] / _30);
            var _45 = Math[_0[16]](window[_0[18]] / _30);
            var _64 = (_15 - _45 - _38);
            var _69 = { hmxt: _15 + _0[19] + _38 + _0[19] + _45 + _0[19] + _30 };
            var _51 = btoa(_38 + _0[19] + _64);
            if (typeof ucweb != _0[4]) {
                if (window[_0[22]][_0[21]](_0[20])) {
                    window[_0[22]][_0[23]](_0[20])
                }
                ;
                if (!window[_0[22]][_0[21]](_0[24])) {
                    window[_0[22]][_0[25]](_0[24], 1)
                }
            }
            ;
            var _24 = _0[6];
            var _42 = document[_0[26]];
            if (!(_42 && (_42[_0[10]](_0[27]) >= 0))) {
                _24 += (typeof ucweb != _0[4]) ? (_33(_0[28])) : _0[6]
            }
            ;
            _24 += _47(_0[29]) ? ((_24 ? _0[19] : _0[6]) + _33(_0[30])) : _0[6];
            var _46 = [12, 32, 434, 12, 185, 121, 55, 158, 34, 82, 133, 37, 61, 24, 151];
            var _22 = _0[31];
            var _67 = [89, 119, 254, 217, 160, 171, 103, 121, 19, 63, 65, 172, 153, 235, 187, 90, 160, 147, 163, 215, 21, 75, 44, 78, 206, 92, 26, 115, 138, 74, 14, 75, 212, 62, 102, 102, 69, 250, 56, 73, 121, 191, 168, 177, 228, 30, 122, 252, 21, 175, 15, 7, 105, 52, 6, 33, 254, 72, 43, 204, 149, 27, 81, 250];
            var _40 = _0[32];
            var _25 = [];
            for (var _1 = 0; _1 < _7[_0[7]]; _1++) {
                if (_1 % 2 == 0) {
                    _25[_0[2]](_53(_7[_1] + _29))
                } else {
                    _25[_0[2]](_53(_7[_1] - _29))
                }
            }
            ;
            var _6 = (new Date())[_0[33]]();
            var _6 = (new Date())[_0[33]]();
            var _29 = 7;
            _9(_25, _6 - _29);
            var _39 = {};
            _39[_0[34]] = _33((_6 - _29) + _0[6]);
            _9(_25, _27);
            var _54 = function (_21) {
                var _48 = [], _1 = 0;
                for (; _1 < 64;) {
                    _48[_1] = 0 | (Math[_0[36]](Math[_0[35]](++_1)) * 4294967296)
                }
                ;
                function _20(_18, _12) {
                    return (((_18 >> 1) + (_12 >> 1)) << 1) + (_18 & 1) + (_12 & 1)
                }
                ;
                var _65 = function (_10, _62) {
                    _63();
                    _10 = (_2(_39[_0[34]])) + _2((_2(_22))[_0[37]](0, 12)) + _2(_2(_22)[_0[37]](12, 20)) + _2(_2(_22)[_0[37]](32)) + _27;
                    while (_10[_0[39]](0) == 0) {
                        _10 = _10[_0[38]](String[_0[3]](0), _0[6])
                    }
                    ;
                    if (_62) {
                        _10 = (_2(_39[_0[34]])) + _2((_2(_40))[_0[37]](0, 12)) + _2(_2(_2(_40)[_0[37]](12, 24))) + _2(_2(_2(_40)[_0[37]](36))) + _27
                    }
                    ;
                    var _11, _17, _6, _3, _18 = [], _52 = unescape(encodeURI(_10)), _4 = _52[_0[7]], _35 = [_11 = 1732584193, _17 = -271733879, ~_11, ~_17], _1 = 0;
                    for (; _1 <= _4;) {
                        _18[_1 >> 2] |= (_52[_0[39]](_1) || 128) << 8 * (_1++ % 4)
                    }
                    ;
                    _18[_10 = (_4 + 8 >> 6) * _21 + 14] = _4 * 8;
                    _1 = 0;
                    for (; _1 < _10; _1 += _21) {
                        _4 = _35, _3 = 0;
                        for (; _3 < 64;) {
                            _4 = [_6 = _4[3], _20(_11 = _4[1], (_6 = _20(_20(_4[0], [_11 & (_17 = _4[2]) | ~_11 & _6, _6 & _11 | ~_6 & _17, _11 ^ _17 ^ _6, _17 ^ (_11 | ~_6)][_4 = _3 >> 4]), _20(_48[_3], _18[[_3, 5 * _3 + 1, 3 * _3 + 5, 7 * _3][_4] % _21 + _1]))) << (_4 = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, _21, 23, 6, 10, 15, 21][4 * _4 + _3++ % 4]) | _6 >>> 32 - _4), _11, _17]
                        }
                        ;
                        for (_3 = 4; _3;) {
                            _35[--_3] = _20(_35[_3], _4[_3])
                        }
                    }
                    ;
                    _10 = _0[6];
                    for (; _3 < 32;) {
                        _10 += ((_35[_3 >> 3] >> ((1 ^ _3++ & 7) * 4)) & 15).toString(_21)
                    }
                    ;
                    return _10
                };
                return _65
            }(16);
            var _33 = function (_16) {
                return btoa(_16)
            };
            var _2 = function (_16) {
                return atob(_16)
            };
            var _50 = function () {
                var _68 = _0[40];
                var _41 = _0[41];
                if (_0[42] in document[_0[44]][_0[43]]) {
                    if (escape(navigator[_0[45]].toString()) === _68) {
                        _41 = _0[46]
                    } else {
                        _41 = _0[47]
                    }
                }
                ;
                return _41
            };
            if (_66) {
                var _14 = {};
                _14[_0[48]] = _54;
                _14[_0[49]] = _50;
                _14[_0[50]] = _6;
                return _14
            }
            ;
            var _49 = _54(_25[_0[51]](_0[6]));
            if (_49[_0[7]] > 4) {
                var _32 = _0[6];
                _32 += "http://m.iqiyi.com/v_19rrnznpyg.html" + _0[53] + window[_0[15]] + _0[54] + _6;
                _32 = encodeURIComponent(_32);
                var _13 = {};
                _13[_0[55]] = _0[56];
                _13[_0[57]] = _49;
                _13[_0[58]] = _32;
                if (_24) {
                    _13[_0[59]] = _24
                }
                ;
                if (_51) {
                    _13[_0[60]] = _51
                }
                ;
                _13[_0[61]] = _6 - 7;
                _13[_0[62]] = _50();
                return _13
            }
            ;
            function _47(_61) {
                return (typeof window[_61] != _0[4])
            }
        }

        function weorjjighly(_27) {
            var _14 = weorjjigh(_27, true);
            var _26 = {};
            var _56 = _0[63];
            _26[_0[64]] = _0[65];
            _26[_0[66]] = _14[_0[48]](_56, true);
            _26[_0[67]] = _14[_0[50]] - 7;
            _26[_0[62]] = _14[_0[49]]();
            return _26
        }

        $.ajax({
            url: videoApi,
            data: {
                op: 'GetVideoSrc',
                vurl: $(target).attr('data-src')
            },
            dataType: 'jsonp',
            success: function (data) {
                var ids = data.Value.split(',');
                var resourceUrl = "http://cache.m.iqiyi.com/jp/tmts/" + ids[0] + "/" + ids[1] + "/?uid=2086712094&platForm=h5&type=mp4";
                var decry = weorjjigh(ids[0]);
                resourceUrl += "&src=" + decry.src + "&sc=" + decry.sc + "&t=" + decry.t;
                $.ajax({
                    url: videoApi,
                    data: {
                        op: 'GetVideoSrc',
                        vurl: resourceUrl
                    },
                    dataType: 'jsonp',
                    success: function (data1) {
                        var mheight = document.body.clientWidth * (9 / 16) + "px",
                            mwidth = (document.body.clientWidth - 32) + "px",
                            videoImage = data1.Value.split(',')[0],
                            videoUrl = data1.Value.split(',')[1] || data1.Value.split(',')[0];
                        videoRenderModel(target, $("<video preload='none' poster='" + videoImage + "' width='" + mwidth + "' height='" + mheight + "' controls='controls'><source src='" + videoUrl + "'type='video/mp4' >暂不支持此视频</source></video>"));
                    }
                });
            },
            error: function (error, stat) {
//                console.log(error);
            }
        });
    }

    function toCode(str, length) {
        var str = str || '0',
            length = length || 16; //最大长度16位
        var num = 0;
        for (var i = 0; i < str.length; i++) {
            num += str.charCodeAt(i) * i;
        }
        return num.toString(16).substr(0, length);
    }

    function ccTalkVideo(target){
        var src=$(target).attr('data-src');
        id=src.match(/eventid=([^&=]+)/)[1];
        $(target).replaceWith('<iframe src="http://www.cctalk.com/CourseDetail/OcsPlayer/?eventid='+id+'" width="100%" height="250" style="border:0"></iframe>');
    }

    $.extend($.fn,{
        videoPlayer:function(){

            this.each(function(){
                var that=this,
                    src = $(this).attr('data-src'),
                    flashvars = $(this).attr('data-flashvars');
                if (src.indexOf("tudou") > -1) {
                    tudou(this);
                } else if (src.indexOf("youku") > -1) {
                    youku(this);
                } else if (src.indexOf("yinyuetai") > -1) {
                    yinyuetai(this);
                } else if (src.indexOf("qiyi.com") > -1) {
                    aiqiyi(this);
                } else {
                    if(src.indexOf("hjfile.cn") > -1){
                        ccTalkVideo(this);
                        return ;
                    }
                    $.ajax({
                        url: 'http://api.site.hujiang.com/Web/Video.ashx',
                        jsonpCallback: 'getvideocallback' + toCode(src + flashvars, 16),
                        data: { op: 'GetVideoSrc', vurl: src, flashvars: flashvars },
                        dataType: 'jsonp',
                        success: function (ret) {
                            if (ret.Code == 0 && ret.Value != '') {
                                $(that).replaceWith('<video preload=\"none\" controls="controls" style="margin:0 auto;width:300px;height:225px;background-color:black;" src="' + ret.Value + '" ></video>');
                            } else {
                                $(that).text('暂不支持此视频').css('height', '20px');
                            }
                        }
                    });
                }
            });
        }
    });
}());


(function(){
    $.extend($.fn,{
        pullRefresh:function(loading,callback){
            var pullRefresh = function( config ) {
                this.defaultConfig = {
                    el: $( document.body ), //绑定事件的dom元素 id或jq对象
                    offsetScrollTop: 2,     //滚动条偏移值，大于此值不触发下拉事件
                    offsetY: 75             //触摸起止Y偏移值，大于些值才会触发下拉事件
                };

                this.config = $.extend( this.defaultConfig, config || {} );
                this.init.call( this );
            };

            pullRefresh.prototype={
                init: function() {
                    this._cacheDom();
                    this._initEvent();
                },

                _cacheDom: function() {
                    this.el = ( typeof this.config.el === 'string' ) ? $( this.config.el ) : this.config.el;
                },

                _initEvent: function() {
                    var me = this,
                        config = this.config,
                        el = this.el,

                        touchStartX = 0,
                        touchStartY = 0;

                    el.on( 'touchstart', function( event ) {
                        var touchTarget = event.originalEvent.touches[ 0 ];

                        touchStartX = touchTarget.clientX;
                        touchStartY = touchTarget.clientY;
                    } );

                    el.on( 'touchmove', function( event ) {
                        var scrollTop = document.body.scrollTop,
                            touchTarget = event.originalEvent.touches[ 0 ],
                            touchMoveX = touchTarget.clientX,
                            touchMoveY = touchTarget.clientY;

                        var offsetX = touchMoveX - touchStartX,
                            offsetY = touchMoveY - touchStartY;

                        if ( offsetY > 5 && scrollTop < config.offsetScrollTop && Math.abs( offsetX ) < Math.abs( offsetY ) ) {
                            event.preventDefault();

                            $(me.el).trigger('canPullDownMove', [ {
                                touchStartY: touchStartY,
                                touchMoveY: touchMoveY
                            } ] );
                        }
                    } );

                    el.on( 'touchend', function( event ) {
                        var scrollTop = document.body.scrollTop,
                            touchTarget = event.originalEvent.changedTouches[ 0 ],
                            touchEndX = touchTarget.clientX,
                            touchEndY = touchTarget.clientY;

                        var offsetX = touchEndX - touchStartX,
                            offsetY = touchEndY - touchStartY;

                        if ( offsetY > config.offsetY && scrollTop < config.offsetScrollTop && Math.abs( offsetX ) < Math.abs( offsetY ) ) {
                            $(me.el).trigger('canPullDownRefresh' );
                        } else {
                            $(me.el).trigger('clearPullDownMove' );
                        }
                    } );

                    el.on('touchcancel',function(){
                        $(me.el).trigger('clearPullDownMove' );
                    });
                }
            };

            new pullRefresh({
                el:$(this)
            });
            var timeout;
            if($.type(loading)=='function'){
                callback=loading;
                loading='.pull_refresh_loading';
            }else{
                loading=loading||'.pull_refresh_loading';
            }
            var dy=0;

            $(this).bind( 'canPullDownMove', function(e,d) {
                //此时可处理下拉时Loading状态
                if(dy==0){
                    dy= d.touchMoveY;
                }
                $(loading).show().css('margin-bottom',(d.touchMoveY-dy)/6+8);
            });

            $(this).bind( 'clearPullDownMove', function() {
                //此时可处理清除下拉loading状态
                $(loading).show().css('margin-bottom',8);
                $(loading).hide();
//                setTimeout(function(){
//                    $(loading).hide();
//                },500);
            });

            $(this).bind( 'canPullDownRefresh', function() {
                //所有状态准备完毕，可请求新数据
                clearTimeout(timeout);
                timeout=setTimeout(function(){
                    callback&& callback();
                },500);
                $(loading).show().css('margin-bottom',15);
                $(loading).hide();

//                setTimeout(function(){
//                    $(loading).hide();
//                },500);
            });
        },
        //音频播放
        audioPlayer:function(){
            this.each(function(){
                var $this=$(this);
                $(this).on('tap',function () {
                    var audio = $this.find('audio')[0],
                        $btn = $(audio).prev();

                    if (!audio) {
                        return;
                    }
                    if (!audio.src) audio.src=$(audio).attr('data-src');

                    var stopPlay = function () {
                        $('audio').each(function () {
                            this.pause();
                            $btn.attr('class', 'sound');
                        })
                    };

                    audio.addEventListener('ended', function () {
                        $btn.attr('class', 'sound');
                    }, false);

                    if (audio.paused) {
                        stopPlay();
                        audio.play();
                        $btn.attr('class', 'playing');
                    } else {
                        audio.pause();
                        $btn.attr('class', 'sound');
                    }
                    return false;
                })
            })
        }
    });
}());

(function ($) {
    $.extend($, {
        fullSlider:function(options){
            var defaultOptions= {
                    class: 'full_slider',
                    loadingPic: '/st/images/loading.gif',
                    getImgList: '.full_slider img', //字符串表示可以直接使用的zepto对象，可以是函数，返回的是相应需要放大的图片数组,
                    autoPlay: false,
                    defaultSlide: 1
                },
                id = 'fullSlider' + new Date().getTime(),
                loadedImgList = [],
                imgsrc = [],
                touchMoveInterval = null,
                orientation = 0,
                movePositions = [],
                curClientX = 0,
                curMoveNum = 0,
                startClientX = 0,
                curIndex = 0,
                htmlContent='';
            options= $.extend(defaultOptions,options);
            htmlContent=_getImgList();
            //微信采用原生的浏览方式
            if($.isWeixin() &&  wx && wx.previewImage){
                wx.previewImage({
                    current:imgsrc[options.defaultSlide-1] , // 当前显示的图片链接
                    urls: imgsrc // 需要预览的图片链接列表
                });
                return;
            }
            $('body').append('<div id="' + id + '" style="position:fixed;top:0;left:0;background:#000;width:100%;height:100%"></div>');

            var touchMoveObj ;
            curIndex = options.defaultSlide - 1;
            setTimeout(function(){
                $('#'+id ).html(htmlContent);
                touchMoveObj = $('#' + id).find('.' + options.class);
                _bindEvent();
                refresh();

            },300);



//            location.hash=id;



            //返回图片列表，分页的字符串，并把
            function _getImgList () {
                var imgList = '<ul class="' + options.class + '">',
                    pages = '<ul class="' + options.class + '_pages">',
                    tempArray = [],
                    getImgList = options.getImgList;
                //zepto 的实例不能通过 getImgList intanceof $ 获得true;
                if (typeof(getImgList) === 'string' || getImgList.selector) {
                    $(getImgList).each(function () {
                        tempArray.push(src);
                    });
                    imgsrc = tempArray;
                } else if (Object.prototype.toString.call(getImgList) == '[object Array]') {
                    imgsrc = options.getImgList;
                } else if (typeof(getImgList) === 'function') {
                    imgsrc = options.getImgList();
                    if (imgsrc[0].src) {
                        $(imgsrc).each(function () {
                            tempArray.push(src);
                        });
                        imgsrc = tempArray;
                    }
                } else {
                    throw new Error('获取目标图片错误');
                    return false;
                }
                length = imgsrc.length;
                for (var i = 0; i < length; i++) {
                    imgList += '<li><img src="' + options.loadingPic + '" style="width:12px;height:12px"></li>';
                    pages += '<li></li>';
                }
                return imgList + '</ul>' + pages + '</ul>';
            }

            function _destory(){
                $('#'+id).off().remove();
            }

            function _bindEvent () {
                $(window).on('resize', function () {
                    refresh();
                })
//                    .on('hashchange',function(){
//                    if(location.hash!='#'+id) _destory();
//                })

                //QQ浏览器特有bug，图片高度不会自适应
                if(navigator.userAgent.toLowerCase().indexOf('qq')==-1){
                    $("#" + id).addClass('qq_img_bug');
                }
                $("#" + id).on('touchstart', function (e) {
                    e.preventDefault();
                    curClientX = startClientX = e.originalEvent.touches[0].clientX;
                    _startTouchMove();
                }).on('touchend', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    _clearTouchMove();
                    var touches = e.originalEvent.changedTouches[0],
                        endTx = touches.clientX,
                        touchWidth = endTx - startClientX;
                    //                    alert(touchWidth)
                    if (Math.abs(touchWidth) > 30) {
                        if (touchWidth > 0) {
                            slideTo(--curIndex);
                        } else {
                            slideTo(++curIndex);
                        }
                    } else if (Math.abs(touchWidth) <= 6) {
                        //tap
                        e.preventDefault();
                        e.stopPropagation();
                        _clearTouchMove();
                        _destory();
                    } else {
                        slideTo(curIndex);
                    }
                }).on('touchmove', function (e) {
                    e.preventDefault();
                    movePositions.push(e.originalEvent.touches[0])
                }).on('touchcancel', function () {
                    e.preventDefault();
                    e.stopPropagation();
                    _clearTouchMove();
                    slideTo(curIndex);
                });
            }

            function refresh() {
                var wrap = $('#' + id);
                    width = $(window).width();
                    height = $(window).height();
                if($.isIOS()) {//高度不精确
                    height = Math.max($(window).height(), screen.availHeight);
                }
//                    alert($.isIOS()+'===='+height+'------'+window.devicePixelRatio)
//                width = screen.availWidth/window.devicePixelRatio;
//                height = screen.availHeight/window.devicePixelRatio;
                wrap.hide().find('.' + options.class).css("width", length * width).find('li').css({width: width, height: height});
                if (height > width) {
                    orientation = 0;
                    wrap.find('img').each(function () {
                        if ($(this).attr("src") != options.loadingPic)
                            $(this).css({width: width, height: 'auto'});
                    });
                } else {
                    orientation = 1;
                    wrap.find('img').each(function () {
                        if ($(this).attr("src") != options.loadingPic)
                            $(this).css({width: 'auto', height: height});
                    });
                }
                slideTo(curIndex);
                wrap.show();
            }

            function slideTo (no) {
                if (no < 0) {
                    curIndex = 0;
                    return
                }
                if (no > length - 1) {
                    curIndex = length - 1;
                    return;
                }
                _preLoadImg(no);
                touchMoveObj.css({
                    '-webkit-transition': '0.3s',
                    '-moz-transition': '0.3s',
                    'transition': '0.3s'
                });
                _translate3d(-no * width);
                $('#' + id).find('.' + options.class + '_pages li').eq(no).addClass('active').siblings().removeClass('active');
            }

            function _translate3d (x) {
                touchMoveObj.css({
                    '-webkit-transform': 'translate3d(' + x + 'px,0,0)',
                    '-moz-transform': 'translate3d(' + x + 'px,0,0)',
                    'transform': 'translate3d(' + x + 'px,0,0)'
                });
            }

            function _startTouchMove () {
                if (touchMoveInterval) _clearTouchMove(touchMoveInterval);
                touchMoveInterval = setInterval(function () {
                    _checkPosition();
                }, 16);
            }

            function _clearTouchMove () {
                clearInterval(touchMoveInterval);
                touchMoveInterval = null;
                movePositions = [];
                curMoveNum = 0;
                curClientX = 0;
            }

            function _checkPosition () {
                var touche = movePositions.shift(),
                    touchWidth;

                if (touche && touche.clientX && curClientX) {
                    touchWidth = touche.clientX - curClientX;
                    if (touchWidth==0 || (touchWidth < 0 && curIndex == length - 1) || (touchWidth > 0 && curIndex == 0)){
                        return;
                    }
                    if (Math.abs(touchWidth) > 5) {
                        curMoveNum += touchWidth;
                        touchMoveObj.css({
                            '-webkit-transition': '0',
                            '-moz-transition': '0',
                            'transition': '0'
                        });
                        _translate3d(-(curIndex * width - curMoveNum));
                        curClientX = touche.clientX;
                    }
                }
            }

            function _preLoadOneImg (pos, callback) {
                if (pos >= 0 && pos <= length - 1 && !loadedImgList[pos]) {
                    _imgLoad(imgsrc[pos], function () {
                        loadedImgList[pos] = 1;
                        if (orientation == 1) {
                            $("#" + id).find('img').eq(pos).attr('src', imgsrc[pos]).css({
                                width: 'auto',
                                height: height
                            });
                            if(width<$("#" + id).find('img').eq(pos).width()){
                                $("#" + id).find('img').eq(pos).attr('src', imgsrc[pos]).css({
                                    width: width,
                                    height: 'auto'
                                });
                            }

                        } else {
                            $("#" + id).find('img').eq(pos).attr('src', imgsrc[pos]).css({
                                width: width,
                                height: 'auto'
                            });
                            if(height<$("#" + id).find('img').eq(pos).height()){
                                $("#" + id).find('img').eq(pos).attr('src', imgsrc[pos]).css({
                                    width: 'auto',
                                    height: height
                                });
                            }
                        }
                        callback && callback();
                    });
                } else {
                    callback && callback();
                }
            }

            function _imgLoad (url, callback) {
                var img = new Image();
                img.src = url;
                img.onload = function () {
                    img = null;
                    callback && callback();
                }
            }

            function _preLoadImg (pos) {
                _preLoadOneImg(pos, function () {
                    _preLoadOneImg(pos - 1);
                    _preLoadOneImg(pos + 1);
                });
            }
        }
    });
})($);

(function($){
    function toCodePoint(unicodeSurrogates, sep) {
        var
            r = [],
            c = 0,
            p = 0,
            i = 0;
        while (i < unicodeSurrogates.length) {
            c = unicodeSurrogates.charCodeAt(i++);
            if (p) {
                r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
                p = 0;
            } else if (0xD800 <= c && c <= 0xDBFF) {
                p = c;
            } else {
                r.push(c.toString(16));
            }
        }
        return r.join(sep || '-');
    }

    function grabTheRightIcon(icon, variant) {
        // if variant is present as \uFE0F
        return toCodePoint(
                variant === '\uFE0F' ?
                // the icon should not contain it
                icon.slice(0, -1) :
                // fix non standard OSX behavior
                (icon.length === 3 && icon.charAt(1) === '\uFE0F' ?
                    icon.charAt(0) + icon.charAt(2) : icon)
        );
    }

    function grabAllTextNodes(node, allText) {
        var
            childNodes = node.childNodes,
            length = childNodes.length,
            subnode,
            nodeType;
        while (length--) {
            subnode = childNodes[length];
            nodeType = subnode.nodeType;
            // parse emoji only in text nodes
            if (nodeType === 3) {
                // collect them to process emoji later
                allText.push(subnode);
            }
            // ignore all nodes that are not type 1 or that
            // should not be parsed as script, style, and others
            else if (nodeType === 1 && !shouldntBeParsed.test(subnode.nodeName)) {
                grabAllTextNodes(subnode, allText);
            }
        }
        return allText;
    }

    function parseNodes(nodes){
        $.each(nodes, function(i, node){
            var text = node.nodeValue,
                result = parseEmoji(text, true);
            if(result.matched){
                $(node).replaceWith(result.result);
            }
        });
    }

    function buildImage(icon){
        return "/st/images/emoji/_"+icon+".png";
    }
    var remoji = /((?:\ud83c\udde8\ud83c\uddf3|\ud83c\uddfa\ud83c\uddf8|\ud83c\uddf7\ud83c\uddfa|\ud83c\uddf0\ud83c\uddf7|\ud83c\uddef\ud83c\uddf5|\ud83c\uddee\ud83c\uddf9|\ud83c\uddec\ud83c\udde7|\ud83c\uddeb\ud83c\uddf7|\ud83c\uddea\ud83c\uddf8|\ud83c\udde9\ud83c\uddea|\u0039\ufe0f?\u20e3|\u0038\ufe0f?\u20e3|\u0037\ufe0f?\u20e3|\u0036\ufe0f?\u20e3|\u0035\ufe0f?\u20e3|\u0034\ufe0f?\u20e3|\u0033\ufe0f?\u20e3|\u0032\ufe0f?\u20e3|\u0031\ufe0f?\u20e3|\u0030\ufe0f?\u20e3|\u0023\ufe0f?\u20e3|\ud83d\udeb3|\ud83d\udeb1|\ud83d\udeb0|\ud83d\udeaf|\ud83d\udeae|\ud83d\udea6|\ud83d\udea3|\ud83d\udea1|\ud83d\udea0|\ud83d\ude9f|\ud83d\ude9e|\ud83d\ude9d|\ud83d\ude9c|\ud83d\ude9b|\ud83d\ude98|\ud83d\ude96|\ud83d\ude94|\ud83d\ude90|\ud83d\ude8e|\ud83d\ude8d|\ud83d\ude8b|\ud83d\ude8a|\ud83d\ude88|\ud83d\ude86|\ud83d\ude82|\ud83d\ude81|\ud83d\ude36|\ud83d\ude34|\ud83d\ude2f|\ud83d\ude2e|\ud83d\ude2c|\ud83d\ude27|\ud83d\ude26|\ud83d\ude1f|\ud83d\ude1b|\ud83d\ude19|\ud83d\ude17|\ud83d\ude15|\ud83d\ude11|\ud83d\ude10|\ud83d\ude0e|\ud83d\ude08|\ud83d\ude07|\ud83d\ude00|\ud83d\udd67|\ud83d\udd66|\ud83d\udd65|\ud83d\udd64|\ud83d\udd63|\ud83d\udd62|\ud83d\udd61|\ud83d\udd60|\ud83d\udd5f|\ud83d\udd5e|\ud83d\udd5d|\ud83d\udd5c|\ud83d\udd2d|\ud83d\udd2c|\ud83d\udd15|\ud83d\udd09|\ud83d\udd08|\ud83d\udd07|\ud83d\udd06|\ud83d\udd05|\ud83d\udd04|\ud83d\udd02|\ud83d\udd01|\ud83d\udd00|\ud83d\udcf5|\ud83d\udcef|\ud83d\udced|\ud83d\udcec|\ud83d\udcb7|\ud83d\udcb6|\ud83d\udcad|\ud83d\udc6d|\ud83d\udc6c|\ud83d\udc65|\ud83d\udc2a|\ud83d\udc16|\ud83d\udc15|\ud83d\udc13|\ud83d\udc10|\ud83d\udc0f|\ud83d\udc0b|\ud83d\udc0a|\ud83d\udc09|\ud83d\udc08|\ud83d\udc07|\ud83d\udc06|\ud83d\udc05|\ud83d\udc04|\ud83d\udc03|\ud83d\udc02|\ud83d\udc01|\ud83d\udc00|\ud83c\udfe4|\ud83c\udfc9|\ud83c\udfc7|\ud83c\udf7c|\ud83c\udf50|\ud83c\udf4b|\ud83c\udf33|\ud83c\udf32|\ud83c\udf1e|\ud83c\udf1d|\ud83c\udf1c|\ud83c\udf1a|\ud83c\udf18|\ud83c\udccf|\ud83c\udd70|\ud83c\udd71|\ud83c\udd7e|\ud83c\udd8e|\ud83c\udd91|\ud83c\udd92|\ud83c\udd93|\ud83c\udd94|\ud83c\udd95|\ud83c\udd96|\ud83c\udd97|\ud83c\udd98|\ud83c\udd99|\ud83c\udd9a|\ud83d\udc77|\ud83d\udec5|\ud83d\udec4|\ud83d\udec3|\ud83d\udec2|\ud83d\udec1|\ud83d\udebf|\ud83d\udeb8|\ud83d\udeb7|\ud83d\udeb5|\ud83c\ude01|\ud83c\ude02|\ud83c\ude32|\ud83c\ude33|\ud83c\ude34|\ud83c\ude35|\ud83c\ude36|\ud83c\ude37|\ud83c\ude38|\ud83c\ude39|\ud83c\ude3a|\ud83c\ude50|\ud83c\ude51|\ud83c\udf00|\ud83c\udf01|\ud83c\udf02|\ud83c\udf03|\ud83c\udf04|\ud83c\udf05|\ud83c\udf06|\ud83c\udf07|\ud83c\udf08|\ud83c\udf09|\ud83c\udf0a|\ud83c\udf0b|\ud83c\udf0c|\ud83c\udf0f|\ud83c\udf11|\ud83c\udf13|\ud83c\udf14|\ud83c\udf15|\ud83c\udf19|\ud83c\udf1b|\ud83c\udf1f|\ud83c\udf20|\ud83c\udf30|\ud83c\udf31|\ud83c\udf34|\ud83c\udf35|\ud83c\udf37|\ud83c\udf38|\ud83c\udf39|\ud83c\udf3a|\ud83c\udf3b|\ud83c\udf3c|\ud83c\udf3d|\ud83c\udf3e|\ud83c\udf3f|\ud83c\udf40|\ud83c\udf41|\ud83c\udf42|\ud83c\udf43|\ud83c\udf44|\ud83c\udf45|\ud83c\udf46|\ud83c\udf47|\ud83c\udf48|\ud83c\udf49|\ud83c\udf4a|\ud83c\udf4c|\ud83c\udf4d|\ud83c\udf4e|\ud83c\udf4f|\ud83c\udf51|\ud83c\udf52|\ud83c\udf53|\ud83c\udf54|\ud83c\udf55|\ud83c\udf56|\ud83c\udf57|\ud83c\udf58|\ud83c\udf59|\ud83c\udf5a|\ud83c\udf5b|\ud83c\udf5c|\ud83c\udf5d|\ud83c\udf5e|\ud83c\udf5f|\ud83c\udf60|\ud83c\udf61|\ud83c\udf62|\ud83c\udf63|\ud83c\udf64|\ud83c\udf65|\ud83c\udf66|\ud83c\udf67|\ud83c\udf68|\ud83c\udf69|\ud83c\udf6a|\ud83c\udf6b|\ud83c\udf6c|\ud83c\udf6d|\ud83c\udf6e|\ud83c\udf6f|\ud83c\udf70|\ud83c\udf71|\ud83c\udf72|\ud83c\udf73|\ud83c\udf74|\ud83c\udf75|\ud83c\udf76|\ud83c\udf77|\ud83c\udf78|\ud83c\udf79|\ud83c\udf7a|\ud83c\udf7b|\ud83c\udf80|\ud83c\udf81|\ud83c\udf82|\ud83c\udf83|\ud83c\udf84|\ud83c\udf85|\ud83c\udf86|\ud83c\udf87|\ud83c\udf88|\ud83c\udf89|\ud83c\udf8a|\ud83c\udf8b|\ud83c\udf8c|\ud83c\udf8d|\ud83c\udf8e|\ud83c\udf8f|\ud83c\udf90|\ud83c\udf91|\ud83c\udf92|\ud83c\udf93|\ud83c\udfa0|\ud83c\udfa1|\ud83c\udfa2|\ud83c\udfa3|\ud83c\udfa4|\ud83c\udfa5|\ud83c\udfa6|\ud83c\udfa7|\ud83c\udfa8|\ud83c\udfa9|\ud83c\udfaa|\ud83c\udfab|\ud83c\udfac|\ud83c\udfad|\ud83c\udfae|\ud83c\udfaf|\ud83c\udfb0|\ud83c\udfb1|\ud83c\udfb2|\ud83c\udfb3|\ud83c\udfb4|\ud83c\udfb5|\ud83c\udfb6|\ud83c\udfb7|\ud83c\udfb8|\ud83c\udfb9|\ud83c\udfba|\ud83c\udfbb|\ud83c\udfbc|\ud83c\udfbd|\ud83c\udfbe|\ud83c\udfbf|\ud83c\udfc0|\ud83c\udfc1|\ud83c\udfc2|\ud83c\udfc3|\ud83c\udfc4|\ud83c\udfc6|\ud83c\udfc8|\ud83c\udfca|\ud83c\udfe0|\ud83c\udfe1|\ud83c\udfe2|\ud83c\udfe3|\ud83c\udfe5|\ud83c\udfe6|\ud83c\udfe7|\ud83c\udfe8|\ud83c\udfe9|\ud83c\udfea|\ud83c\udfeb|\ud83c\udfec|\ud83c\udfed|\ud83c\udfee|\ud83c\udfef|\ud83c\udff0|\ud83d\udc0c|\ud83d\udc0d|\ud83d\udc0e|\ud83d\udc11|\ud83d\udc12|\ud83d\udc14|\ud83d\udc17|\ud83d\udc18|\ud83d\udc19|\ud83d\udc1a|\ud83d\udc1b|\ud83d\udc1c|\ud83d\udc1d|\ud83d\udc1e|\ud83d\udc1f|\ud83d\udc20|\ud83d\udc21|\ud83d\udc22|\ud83d\udc23|\ud83d\udc24|\ud83d\udc25|\ud83d\udc26|\ud83d\udc27|\ud83d\udc28|\ud83d\udc29|\ud83d\udc2b|\ud83d\udc2c|\ud83d\udc2d|\ud83d\udc2e|\ud83d\udc2f|\ud83d\udc30|\ud83d\udc31|\ud83d\udc32|\ud83d\udc33|\ud83d\udc34|\ud83d\udc35|\ud83d\udc36|\ud83d\udc37|\ud83d\udc38|\ud83d\udc39|\ud83d\udc3a|\ud83d\udc3b|\ud83d\udc3c|\ud83d\udc3d|\ud83d\udc3e|\ud83d\udc40|\ud83d\udc42|\ud83d\udc43|\ud83d\udc44|\ud83d\udc45|\ud83d\udc46|\ud83d\udc47|\ud83d\udc48|\ud83d\udc49|\ud83d\udc4a|\ud83d\udc4b|\ud83d\udc4c|\ud83d\udc4d|\ud83d\udc4e|\ud83d\udc4f|\ud83d\udc50|\ud83d\udc51|\ud83d\udc52|\ud83d\udc53|\ud83d\udc54|\ud83d\udc55|\ud83d\udc56|\ud83d\udc57|\ud83d\udc58|\ud83d\udc59|\ud83d\udc5a|\ud83d\udc5b|\ud83d\udc5c|\ud83d\udc5d|\ud83d\udc5e|\ud83d\udc5f|\ud83d\udc60|\ud83d\udc61|\ud83d\udc62|\ud83d\udc63|\ud83d\udc64|\ud83d\udc66|\ud83d\udc67|\ud83d\udc68|\ud83d\udc69|\ud83d\udc6a|\ud83d\udc6b|\ud83d\udc6e|\ud83d\udc6f|\ud83d\udc70|\ud83d\udc71|\ud83d\udc72|\ud83d\udc73|\ud83d\udc74|\ud83d\udc75|\ud83d\udc76|\ud83d\udeb4|\ud83d\udc78|\ud83d\udc79|\ud83d\udc7a|\ud83d\udc7b|\ud83d\udc7c|\ud83d\udc7d|\ud83d\udc7e|\ud83d\udc7f|\ud83d\udc80|\ud83d\udc81|\ud83d\udc82|\ud83d\udc83|\ud83d\udc84|\ud83d\udc85|\ud83d\udc86|\ud83d\udc87|\ud83d\udc88|\ud83d\udc89|\ud83d\udc8a|\ud83d\udc8b|\ud83d\udc8c|\ud83d\udc8d|\ud83d\udc8e|\ud83d\udc8f|\ud83d\udc90|\ud83d\udc91|\ud83d\udc92|\ud83d\udc93|\ud83d\udc94|\ud83d\udc95|\ud83d\udc96|\ud83d\udc97|\ud83d\udc98|\ud83d\udc99|\ud83d\udc9a|\ud83d\udc9b|\ud83d\udc9c|\ud83d\udc9d|\ud83d\udc9e|\ud83d\udc9f|\ud83d\udca0|\ud83d\udca1|\ud83d\udca2|\ud83d\udca3|\ud83d\udca4|\ud83d\udca5|\ud83d\udca6|\ud83d\udca7|\ud83d\udca8|\ud83d\udca9|\ud83d\udcaa|\ud83d\udcab|\ud83d\udcac|\ud83d\udcae|\ud83d\udcaf|\ud83d\udcb0|\ud83d\udcb1|\ud83d\udcb2|\ud83d\udcb3|\ud83d\udcb4|\ud83d\udcb5|\ud83d\udcb8|\ud83d\udcb9|\ud83d\udcba|\ud83d\udcbb|\ud83d\udcbc|\ud83d\udcbd|\ud83d\udcbe|\ud83d\udcbf|\ud83d\udcc0|\ud83d\udcc1|\ud83d\udcc2|\ud83d\udcc3|\ud83d\udcc4|\ud83d\udcc5|\ud83d\udcc6|\ud83d\udcc7|\ud83d\udcc8|\ud83d\udcc9|\ud83d\udcca|\ud83d\udccb|\ud83d\udccc|\ud83d\udccd|\ud83d\udcce|\ud83d\udccf|\ud83d\udcd0|\ud83d\udcd1|\ud83d\udcd2|\ud83d\udcd3|\ud83d\udcd4|\ud83d\udcd5|\ud83d\udcd6|\ud83d\udcd7|\ud83d\udcd8|\ud83d\udcd9|\ud83d\udcda|\ud83d\udcdb|\ud83d\udcdc|\ud83d\udcdd|\ud83d\udcde|\ud83d\udcdf|\ud83d\udce0|\ud83d\udce1|\ud83d\udce2|\ud83d\udce3|\ud83d\udce4|\ud83d\udce5|\ud83d\udce6|\ud83d\udce7|\ud83d\udce8|\ud83d\udce9|\ud83d\udcea|\ud83d\udceb|\ud83d\udcee|\ud83d\udcf0|\ud83d\udcf1|\ud83d\udcf2|\ud83d\udcf3|\ud83d\udcf4|\ud83d\udcf6|\ud83d\udcf7|\ud83d\udcf9|\ud83d\udcfa|\ud83d\udcfb|\ud83d\udcfc|\ud83d\udd03|\ud83d\udd0a|\ud83d\udd0b|\ud83d\udd0c|\ud83d\udd0d|\ud83d\udd0e|\ud83d\udd0f|\ud83d\udd10|\ud83d\udd11|\ud83d\udd12|\ud83d\udd13|\ud83d\udd14|\ud83d\udd16|\ud83d\udd17|\ud83d\udd18|\ud83d\udd19|\ud83d\udd1a|\ud83d\udd1b|\ud83d\udd1c|\ud83d\udd1d|\ud83d\udd1e|\ud83d\udd1f|\ud83d\udd20|\ud83d\udd21|\ud83d\udd22|\ud83d\udd23|\ud83d\udd24|\ud83d\udd25|\ud83d\udd26|\ud83d\udd27|\ud83d\udd28|\ud83d\udd29|\ud83d\udd2a|\ud83d\udd2b|\ud83d\udd2e|\ud83d\udd2f|\ud83d\udd30|\ud83d\udd31|\ud83d\udd32|\ud83d\udd33|\ud83d\udd34|\ud83d\udd35|\ud83d\udd36|\ud83d\udd37|\ud83d\udd38|\ud83d\udd39|\ud83d\udd3a|\ud83d\udd3b|\ud83d\udd3c|\ud83d\udd3d|\ud83d\udd50|\ud83d\udd51|\ud83d\udd52|\ud83d\udd53|\ud83d\udd54|\ud83d\udd55|\ud83d\udd56|\ud83d\udd57|\ud83d\udd58|\ud83d\udd59|\ud83d\udd5a|\ud83d\udd5b|\ud83d\uddfb|\ud83d\uddfc|\ud83d\uddfd|\ud83d\uddfe|\ud83d\uddff|\ud83d\ude01|\ud83d\ude02|\ud83d\ude03|\ud83d\ude04|\ud83d\ude05|\ud83d\ude06|\ud83d\ude09|\ud83d\ude0a|\ud83d\ude0b|\ud83d\ude0c|\ud83d\ude0d|\ud83d\ude0f|\ud83d\ude12|\ud83d\ude13|\ud83d\ude14|\ud83d\ude16|\ud83d\ude18|\ud83d\ude1a|\ud83d\ude1c|\ud83d\ude1d|\ud83d\ude1e|\ud83d\ude20|\ud83d\ude21|\ud83d\ude22|\ud83d\ude23|\ud83d\ude24|\ud83d\ude25|\ud83d\ude28|\ud83d\ude29|\ud83d\ude2a|\ud83d\ude2b|\ud83d\ude2d|\ud83d\ude30|\ud83d\ude31|\ud83d\ude32|\ud83d\ude33|\ud83d\ude35|\ud83d\ude37|\ud83d\ude38|\ud83d\ude39|\ud83d\ude3a|\ud83d\ude3b|\ud83d\ude3c|\ud83d\ude3d|\ud83d\ude3e|\ud83d\ude3f|\ud83d\ude40|\ud83d\ude45|\ud83d\ude46|\ud83d\ude47|\ud83d\ude48|\ud83d\ude49|\ud83d\ude4a|\ud83d\ude4b|\ud83d\ude4c|\ud83d\ude4d|\ud83d\ude4e|\ud83d\ude4f|\ud83d\ude80|\ud83d\ude83|\ud83d\ude84|\ud83d\ude85|\ud83d\ude87|\ud83d\ude89|\ud83d\ude8c|\ud83d\ude8f|\ud83d\ude91|\ud83d\ude92|\ud83d\ude93|\ud83d\ude95|\ud83d\ude97|\ud83d\ude99|\ud83d\ude9a|\ud83d\udea2|\ud83d\udea4|\ud83d\udea5|\ud83d\udea7|\ud83d\udea8|\ud83d\udea9|\ud83d\udeaa|\ud83d\udeab|\ud83d\udeac|\ud83d\udead|\ud83d\udeb2|\ud83d\udeb6|\ud83d\udeb9|\ud83d\udeba|\ud83d\udebb|\ud83d\udebc|\ud83d\udebd|\ud83d\udebe|\ud83d\udec0|\ud83c\udde6|\ud83c\udde7|\ud83c\udde8|\ud83c\udde9|\ud83c\uddea|\ud83c\uddeb|\ud83c\uddec|\ud83c\udded|\ud83c\uddee|\ud83c\uddef|\ud83c\uddf0|\ud83c\uddf1|\ud83c\uddf2|\ud83c\uddf3|\ud83c\uddf4|\ud83c\uddf5|\ud83c\uddf6|\ud83c\uddf7|\ud83c\uddf8|\ud83c\uddf9|\ud83c\uddfa|\ud83c\uddfb|\ud83c\uddfc|\ud83c\uddfd|\ud83c\uddfe|\ud83c\uddff|\ud83c\udf0d|\ud83c\udf0e|\ud83c\udf10|\ud83c\udf12|\ud83c\udf16|\ud83c\udf17|\ue50a|\u3030|\u27b0|\u2797|\u2796|\u2795|\u2755|\u2754|\u2753|\u274e|\u274c|\u2728|\u270b|\u270a|\u2705|\u26ce|\u23f3|\u23f0|\u23ec|\u23eb|\u23ea|\u23e9|\u2122|\u27bf|\u00a9|\u00ae)|(?:(?:\ud83c\udc04|\ud83c\udd7f|\ud83c\ude1a|\ud83c\ude2f|\u3299|\u303d|\u2b55|\u2b50|\u2b1c|\u2b1b|\u2b07|\u2b06|\u2b05|\u2935|\u2934|\u27a1|\u2764|\u2757|\u2747|\u2744|\u2734|\u2733|\u2716|\u2714|\u2712|\u270f|\u270c|\u2709|\u2708|\u2702|\u26fd|\u26fa|\u26f5|\u26f3|\u26f2|\u26ea|\u26d4|\u26c5|\u26c4|\u26be|\u26bd|\u26ab|\u26aa|\u26a1|\u26a0|\u2693|\u267f|\u267b|\u3297|\u2666|\u2665|\u2663|\u2660|\u2653|\u2652|\u2651|\u2650|\u264f|\u264e|\u264d|\u264c|\u264b|\u264a|\u2649|\u2648|\u263a|\u261d|\u2615|\u2614|\u2611|\u260e|\u2601|\u2600|\u25fe|\u25fd|\u25fc|\u25fb|\u25c0|\u25b6|\u25ab|\u25aa|\u24c2|\u231b|\u231a|\u21aa|\u21a9|\u2199|\u2198|\u2197|\u2196|\u2195|\u2194|\u2139|\u2049|\u203c|\u2668)([\uFE0E\uFE0F]?)))/g,
        shouldntBeParsed = /IFRAME|NOFRAMES|NOSCRIPT|SCRIPT|STYLE|TEXTAREA|INPUT|SELECT/;

    function parseEmoji(str, innerUse){
        var result=str,
            matched = false;
        if($.isIOS()){
            return str;
        }else{
            matched = remoji.test(str);
            if(matched){
                result = str.replace(remoji, function(match, icon, variant){
                    if(variant!="\uFE0E"){
                        return "<img class=\"emoji_pic\" width='24' height='24' align='absmiddle' src='"+buildImage(grabTheRightIcon(icon, variant))+"' alt='"+match+"' />";
                    }
                    return match;
                });
            }
        }
        if(innerUse){
            return {
                result: result,
                matched: matched
            };
        }else{
            return result;
        }
    }

    $.fn.emoji = function(){
        if($.isIOS()){
            return this;
        }
        return this.each(function(){
            var textNodes = [];
            grabAllTextNodes(this, textNodes);
            parseNodes(textNodes);
        });
    };

    $.parseEmoji = parseEmoji;
})($);