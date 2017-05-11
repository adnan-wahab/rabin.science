var sketchWindow, processor, showFrameRate = false,
    sketchPlaying = false;


var sketchEngine = function () {

}
sketchEngine.setupPjs = function (code) {

    //create iframe
    var iframe = document.createElement('iframe');
    $(iframe).addClass('inactive');
    var head = '<head><base href="/sketch/' + sketch.visualID + '/files/"><link><link rel="stylesheet" href="/assets/css/sketch/sketchIframe.css"></head>';
    var body = '<body><canvas id="pjs"></canvas></body>';
    var jquery = '<script language="javascript" type="text/javascript" src="/assets/js/vendor/jquery-1.11.1.min.js"></script>';
    var pjs = '<script language="javascript" type="text/javascript" src="' + sketch.engineUrl + '"></script>';
    var attrchange = '<script language="javascript" type="text/javascript" src="/assets/js/vendor/attrchange.js"></script>';
    var extension = '<script language="javascript" type="text/javascript" src="/assets/js/sketch/pjs_OPextension.js"></script>';
    //        var script = '<script type="application/processing" data-processing-target="pjs">'+code+'</script>'; 
    var script = '<script id="pjsCode" type="application/processing">' + code + '</script>';
    var html = '<html>' + head + body + jquery + pjs + attrchange + extension + script + '</html>';

    $('#sketch').html('');
    $('#sketch').get()[0].appendChild(iframe);
    sketchWindow = iframe.contentWindow;

    sketchWindow.document.open();
    sketchWindow.document.write(html);
    sketchWindow.document.close();
    processor = sketchWindow.processor;
    sketchEngine.sketchReady();
    if (showFrameRate) {
        window.setInterval(function () {
            if (processor && showFrameRate) {
                $('#frameRate').html('fr: ' + Math.round(processor.__frameRate));
            }
        }, 1000);
    }
}
sketchEngine.setupP5js = function (code) {
    $('#sketch').remove('iframe').html('');
    //create iframe
    var iframe = document.createElement('iframe');
    $(iframe).addClass('inactive');
    var body = '<body></body>';
    var head = '<head><base href="/sketch/' + sketch.visualID + '/files/"><link rel="stylesheet" href="/assets/css/sketch/sketchIframe.css"></head>';

    var jquery = '<script language="javascript" type="text/javascript" src="/assets/js/vendor/jquery-1.11.1.min.js"></script>';
    var p5js = '<script language="javascript" type="text/javascript" src="' + sketch.engineUrl + '"></script>';
    var libraries = sketchEngine.getLibraries();
    var extension = '<script language="javascript" type="text/javascript" src="/assets/js/sketch/p5js_OPextension.js"></script>';
    var script = '<script>' + code + '</script>';
    //var script = '<script>try{' + code + '} catch(e){ parent.p5jsError(e); throw new error(e);}</script>';
    var html = '<html>' + head + jquery + body + p5js + libraries + extension + script +'</html>';

    $('#sketch').get()[0].appendChild(iframe);

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
    sketchWindow = iframe.contentWindow;

    processor = sketchWindow;
    sketchEngine.sketchReady();
//    window.setInterval(function () {
//        //$('#frameRate').html('fr: ' + Math.round(processor.frameRate()));
//    }, 1000);

}


sketchEngine.setSketchDimensions = function (w, h) {
    //console.info('set dimensions: ',w,h);
    $('iframe').css('width', w); //don't add padding otherwise #sketch has scrollbars.
    $('iframe').css('height', h);
    if($('#embedText').length !== 0){
        var embed = $('#embedText').html();
        embed = embed.replace(/(width\s*=\s*["'])[0-9]+(["'])/ig, function($0,$1,$2){ return $1 + w + $2});
        embed = embed.replace(/(height\s*=\s*["'])[0-9]+(["'])/ig, function($0,$1,$2){ return $1 + h + $2});
        $('#embedText').html(embed);
    }
    return true;
}
sketchEngine.setSketchBackground = function (colorCss) {    
    //have to include #sketch, because mix-blend-mode of introPanel doesn't apply otherwise..
    $('#sketch, body').css('background-color', colorCss);

}
sketchEngine.getSketchFullScreenDimensions = function () {
    return [$(window).width(), $(window).height()];
}

sketchEngine.pauseSketch = function (bool) {
    try {
        if (bool) {
            processor.noLoop();
            //$('#mainControls .icon_play').removeClass('icon_pause');
            $('#mainControls .icon_play').removeClass('icon_restart');
        } else {
            processor.loop();
            $('#mainControls .icon_play').addClass('icon_restart');
        }
        sketchPlaying = !sketchPlaying;

    } catch (e) {

    }
}
sketchEngine.restartSketch = function () {
    sketchEngine.runSketch();
}
sketchEngine.sketchReady = function () {
    window.setTimeout(function(){
        $('#sketch iframe').removeClass('inactive');
    }, 400);
}


sketchEngine.runSketch = function (code) {
    //run sketch
    if (typeof code == 'undefined') {
        code = '';
        //var lineNumber = 0;
        $('#codePanel textarea.code').each(function (d) {
            var c = $(this).val();
            //var lineNumber= c.split("\n");
            //var lineNumberTrace = '//OpenProcessingLineNumberTrace:'+lineNumber
            code += "\n" + c;
        });
    }
    if (sketch.isPjs == "1") {
        sketchEngine.setupPjs(code);

    } else if (sketch.isPjs == "2") {
        sketchEngine.setupP5js(code);

    }


}
sketchEngine.getLibraries = function () {
    var scripts = '';
    if (typeof libraries != 'undefined') {
        var libs = libraries.filter(function (l) {
            return sketch.imports.split(',').indexOf(l.libraryID) > -1
        });
        libs.forEach(function (l) {
            scripts += "<script src='" + l.url + "'></script>"
        });

    }
    return scripts;
}

sketchEngine.slowdownSketch = function (bool) {
    try {
        if (bool) {
            processor.frameRate(15);
        } else {
            processor.frameRate(60);
        }
    } catch (e) {}
}
