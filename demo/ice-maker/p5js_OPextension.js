//$(function () {
    window.onerror = window.parent.sketchConsole.showError;

    //windowWidth and windowHeight to match parent windows width/height
    p5.prototype.windowWidth = window.parent.document.documentElement.clientWidth;
    p5.prototype.windowHeight = window.parent.document.documentElement.clientHeight;
    p5.prototype._onresize = function (e) {
        this._setProperty('windowWidth', window.parent.document.documentElement.clientWidth);
        this._setProperty('windowHeight', window.parent.document.documentElement.clientHeight);
        var context = this._isGlobal ? window : this;
        var executeDefault;
        if (typeof context.windowResized === 'function') {
            executeDefault = context.windowResized(e);
            if (executeDefault !== undefined && !executeDefault) {
                e.preventDefault();
            }
        }
    };

    //extend createCanvas to also set the iframe dimensions
    var cc = p5.prototype.createCanvas;
    p5.prototype.createCanvas = function (w, h, renderer) {
        this.windowWidth = window.parent.document.documentElement.clientWidth;
        this.windowHeight = window.parent.document.documentElement.clientHeight;
        //console.log('create canvas',w,h);
        window.parent.sketchEngine.setSketchDimensions(w, h);
        cc.apply(this, arguments);
        $(window.parent).off("resize");
    }

    var rc = p5.prototype.resizeCanvas;
    p5.prototype.resizeCanvas = function (w, h, renderer) {
        window.parent.sketchEngine.setSketchDimensions(w, h);
        rc.apply(this, arguments);
        $(window.parent).off("resize");
    }

    //extend background to set bg color
    var bg = p5.prototype.background;
    p5.prototype.background = function () {
        var ret = bg.apply(this, arguments);
        //paint window.parent background
        var color;
        if (arguments[0] instanceof p5.Image) {
            color = 'url("")';
            //        } else if (arguments.length == 1 && !isNaN(arguments[0])) { //if greyscale
            //            color = 'rgba(' + arguments[0] + ',' + arguments[0] + ',' + arguments[0] + ',100)';
            //        }
        } else { //if color given
            var c = this.color.apply(this, arguments);
            var maxes = this._renderer._colorMaxes[this._renderer._colorMode];
            //convert maxes to proper css maxes
            var r = red(c) / maxes[0] * 255;
            var g = green(c) / maxes[1] * 255;
            var b = blue(c) / maxes[2] * 255;
            var a = alpha(c) / maxes[3] * 1;
            color = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        }

        window.parent.sketchEngine.setSketchBackground(color);

        return ret;
    }

    //add fullScreen
    var canvasCreated = false;
    p5.prototype.fullScreen = p5.prototype.fullscreen = function (renderer) {
        var self = this;
        try { //sometimes window.parent is not available until resize ends, I guess.
            //add itself to browser behavior
            $(window.parent).off("resize");
            $(window.parent).on('resize', function () {
                //self.noLoop();
                self.fullScreen();
                //window.setTimeout(function(){self.loop();},1200);
            });

            var dims = window.parent.sketchEngine.getSketchFullScreenDimensions();
            if (!canvasCreated) {
                this.createCanvas(dims[0], dims[1], renderer);
            } else {
                this.resizeCanvas(dims[0], dims[1]);
            }
        } catch (e) {

        }
    }

    //print and println
    if(p5.prototype.print){
        var p5Print = p5.prototype.print;
        window.print = p5.prototype.print = p5.prototype.println = function (msg) {
            var ret = p5Print.apply(this, arguments);
            window.parent.sketchConsole.showMessage(msg, false);
        }
    }
   
//});
