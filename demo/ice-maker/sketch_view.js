var newCommentEmptyValue = "what do you think?";

var runDemo = true;
var showFrameRate = false;

//ajax flags
var filesLoaded = false;
var referenceLoaded = false;


//sketchChanged keeps the flag to note if there was any change in the sketch attributes, the tab names, code, anything. If true, present Save/Fork buttons.
//codeChanged keeps the flag if there was any change in the code since the last played on this session. If true, clears console etc. on the next play.
var sketchChanged = false;
var codeChanged = sketchChanged;
var sketchPlaying = true;
var sketchWindow;
var processor = false;
var codeOptionsEnabled = false;
var tabMode;
var owner = sketch.userID == sessionUser.userID;;
var consoleMode = window.owner ? 'auto' : 'minimized'; //minimized if guest, auto if owner or if sketch changed
var forksLoaded = false;

var demo = function() {
    //include functions here on launch, for demo purposes only.
    //clear up in production
    console.log('===DEMO MODE===');

    //$('.icon_code').click();
    //$('.icon_code').click();
    //toggleCodeOptions();
    //$('.icon_fork').click();
    //    $('#filesLink').click();
    //$('#editSketchButton').click();
}




$(function() {

    setupControls();
    $('.hideOnSketch').css('opacity', 1);


    setupComments();
    setupCode();
    setupCodeOptions();
    setupLibraries();


    setupEngineVersions();
    //setupKeys();



    if (sketch.newSketch) {
        setupNewSketch();

        sketchEngine.runSketch(); //to change button to play

        window.setTimeout(function() {
            toggleCodeOptions();
        }, 200);
        window.setTimeout(function() {
            sketchEngine.pauseSketch(true); //to change button to play 2
        }, 500);




    } else { //load existing sketch
        setupExistingSketch();
        //OP.animateTextIn('#introPanel h1', 800, 1200, 0, 2000);
        //OP.animateTextIn('#introPanel h1', 800, 1200, 0);


        window.setTimeout(function() {
            $('#introPanel').addClass('active');
            $('.navbar').addClass('fade2Sketch');
            //OP.animateTextOut('#introPanel h1',900,1000);
            //$('#introPanel').removeClass('active');

        }, 1000);
        window.setTimeout(function() {
            $('#introPanel').removeClass('active');
            //animateTextOut('#introPanel h1',900,1000);

        }, 5000);
        window.setTimeout(function() {
            $('#introPanel').remove();
            //$('.navbar').css('opacity', 1);
        }, 6000);



        setupInfoPanel();




        $('.forceHide').removeClass('forceHide');


        //open panel as provided in hash
        var hash = window.location.hash;
        if (hash) {
            switch (hash) {
                case '#code':
                    $('.icon_code').click();
                    break;
                case '#play':
                    $('.icon_play').click();
                    break;
                case '#info':
                    $('.icon_info').click();
                    break;
            }
        } else {

            sketchEngine.runSketch();
        }

        wannaSave();

        checkHeart();

    }

    if (+sketch.mode > 0) {
        sketchConsole.init(consoleMode);
        $('#archiveInfo').remove();
    } else {
        $('#archiveInfo .bg')
            .css('background-image', 'url("/sketch/' + sketch.visualID + '/thumbnail")')
        $('#archiveInfo').show();

    }


    $('body').removeClass('loading');

    //keep session alive every hour
    var interval = 1 * 60 * 60 * 1000; //in ms
    window.setInterval(function() {
        $.ajax({
            url: "/user/keepSessionAlive",
            cache: false
        });
    }, interval);

    if (runDemo) {
        demo();
    }


})

var setupEngineVersions = function() {

    //find engine version from the library list, and sort by most recent
    var engineVersions = libraries.filter(function(l) {
        if (sketch.isPjs == 2) {
            return l.title == 'p5js';
        } else if (sketch.isPjs == 1) {
            return l.title == 'pjs';
        }
    }).sort(function(a, b) {
        return a.version > b.version ? -1 : 1
    });

    setupPassiveDropdown('#libraryIDDropdown',
        engineVersions,
        function(e) {
            return e.libraryID
        },
        function(d) {
            return d.libraryID == sketch.engineID
        },
        function(d, i) {
            return 'v' + d.version;
        },
        function(d) {
            if (sketch.engineID != d.libraryID) {
                sketch.engineID = d.libraryID;
                sketch.engineUrl = d.url;
                $('#editSketchPanel input[name="engineID"]').val(sketch.engineID);
                sketchChanged = true;
                wannaSave();
            }
        });


}

//creates a selectable dropdown with low footprint. Used for versions.
var setupPassiveDropdown = function(container, data, keyFunction, isSelectedFunction, textFunction, onSelectCallback) {
    var container = d3.select(container);

    //make sure you select the version in the dropdown that is enabled.
    data.forEach(function(d) {
        d.selected = isSelectedFunction(d);
    });

    let vers = container
        .classed('passiveDropdown', true)
        .selectAll('li')
        .data(data, keyFunction);
    vers
        .enter()
        .append('li')
        .attr('value', keyFunction)
        .classed('selected', isSelectedFunction)
        .text(textFunction)
        .on('click', function(d) {
            //toggle the dropdown
            $(container.node()).toggleClass('active');

            //unselect all but the clicked dropdown
            container.selectAll('li')
                .each(function(d) {
                    d.selected = false;
                })
                .classed('selected', false);

            d.selected = true;
            d3.select(this).classed('selected', true);

            //run the callback
            onSelectCallback(d);
        })
        .sort(function(a, b) {
            //sort by version number
            return a.version < b.version ? 1 : -1
        });

    vers.exit().remove();

    //check if none is selected (eg. upon changing pjs/p5js mode, or none is enabled), then select the first option.
    if (container.selectAll('li.selected')[0].length == 0) {
        $(container.node()).find('li:first-of-type').click();
        $(container.node()).toggleClass('active'); //turn off the dropdown (which will open because of above).
    }
}


var myLibraries = [];
var setupLibraries = function() {
    //myLibraries includes all libraries for p5js or pjs
    //ones that are enabled will have 'enabled' attribute set to true
    myLibraries = libraries.filter(function(l) {
        return l.for == sketch.isPjs
    });

    //group libraries by title (because multiple versions)
    myLibraries = d3.nest()
        .key(function(l) {
            return l.title
        })
        .entries(myLibraries);

    //enable the library if any of the versions are in imports
    myLibraries.forEach(function(l) {
        l.enabled = false;
        l.description = l.values[0].description;
        l.docUrl = l.values[0].docUrl;

        l.description = l.description.replace('{{sketch.visualID}}', sketch.visualID); //socketIO description support;

        for (let i in l.values) {
            l.values[i].selected = sketch.imports.split(',').indexOf(l.values[i].libraryID) > -1;
            l.enabled |= l.values[i].selected;
        }
    });



    if (myLibraries.length == 0) {
        $('#libraries').fadeOut(200);
    } else {
        $('#libraries').fadeIn(200);
    }
    var libs = d3.select('#libraries').selectAll('li').data(myLibraries, ff('key'))
    var lisEnter = libs.enter()
        .append('li')
        .classed('library', true)
        .classed('checked', ff('enabled'))
        .classed('col-xs-12', true);
    var label = lisEnter.append('div')
        .classed('settingLabel', true)
    label.append('a')
        .attr('target', '_blank')
        .attr('href', ff('docUrl'))
        .text(ff('key'))
    label.append('ul') //add version dropdown
        .classed('settingVersions', true)
        .each(function(d) {
            //setup version dropdowns for library versions
            setupPassiveDropdown(this,
                d.values,
                function(l) { //keyFunction
                    return l.libraryID
                },
                function(l) { //Selected if:
                    return sketch.imports.split(',').indexOf(l.libraryID) > -1
                },
                function(l, i) { //text content
                    return 'v' + l.version;
                },
                function(l) { //on select:
                    updateSketchImports();
                });

        });

    var options = lisEnter.append('div')
        .classed('settingOptions', true)
        .classed('pull-right', true)

    //'enabled' radio
    options.append('input')
        .attr('type', "checkbox")
        .attr('name', function(d) {
            return "library-" + d.key
        })
        .attr('id', function(d) {
            return "library-" + d.key + "-true"
        })
        .attr('autocomplete', "off")

    options.append('label')
        .attr('for', function(d) {
            return "library-" + d.key + "-true"
        })
        //        .classed('icon', true)
        .each(appendToggleSVG);

    //check the correct radios per libraries selected
    options.selectAll('input[type="checkbox"]')
        .property('checked', ff('enabled'))
        .on('change', function(d) {
            d.enabled = d3.select(this).property('checked');
            var li = $(this).closest('.library')
            li.toggleClass('checked');
            sketchChanged = true;
            wannaSave();
            updateSketchImports();
            //setupLibraries();
        });
    lisEnter.append('div')
        .classed('settingDescription', true)
        .html(ff('description'));


    libs.exit()
        .transition()
        .duration(200)
        .style('opacity', 0)
        .remove();

    d3.selectAll('#libraries li').classed('checked', ff('enabled'));



    setupCodeSnippets(); //to convert code snippets on library descriptions.

}

//find the related versions from the enabled libraries and update imports of the sketch
var updateSketchImports = function() {
    //make sure to sort to prevent 4,3 != 3,4
    let prevImports = sketch.imports.split(',').sort(function(a, b) {
        return a > b ? 1 : -1
    }).join(',');
    sketch.imports = _.flatten(myLibraries
            .filter(ff('enabled'))
            .map(ff('values'))
        )
        .filter(ff('selected'))
        .map(ff('libraryID'))
        .sort(function(a, b) {
            return a > b ? 1 : -1
        })
        .join(',');
    if (prevImports != sketch.imports) {
        sketchChanged = true;
        wannaSave();
    }
    //clog('sketch imports', sketch.imports);
}

var setupKeys = function() {
    Mousetrap.prototype.stopCallback = function(e, element, combo) {
        clog($(element).closest('.CodeMirror').length == 1);
        // if the element has the class "mousetrap" then no need to stop
        if ($(element).hasClass('mousetrap') || $(element).closest('.CodeMirror').length == 1) {
            return false;
        }

        // stop for input, select, and textarea
        return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true');
    }
    //play
    Mousetrap.bind('command+r', function(e) {
        e.preventDefault();
        $('#mainControls .icon_play').click();
        return false;
    });
    //info
    Mousetrap.bind('command+i', function(e) {
        e.preventDefault();
        $('#mainControls .icon_info').click();
        return false;
    });
    //code
    Mousetrap.bind('command+c', function(e) {
        e.preventDefault();
        $('#mainControls .icon_code').click();
        return false;
    });


}

var appendToggleSVG = function(d, i) {
    let svgHTML = '<svg width="46px" height="21px" viewBox="0 0 46 21"> <g class="toggle-toggle" stroke="none" stroke-width="1" fill="none"><circle class="toggle-circle" cx="10.5" cy="10.5" r="10" stroke="#9B9B9B" stroke-width="1" fill="#73C2E9"></circle><polyline class="toggle-checkmark" stroke="#9B9B9B" transform="translate(10.445442, 9.307042) rotate(-320.000000) translate(-10.445442, -9.307042) " points="8.32544172 13.4824213 12.5654415 13.4824213 12.5654415 5.13166233"></polyline><path d="M35,11 L41,11 L41,10 L35,10 L35,4 L34,4 L34,10 L28,10 L28,11 L34,11 L34,17 L35,17 L35,11 Z" class="toggle-X" fill="#9B9B9B" transform="translate(34.500000, 10.500000) rotate(45.000000) translate(-34.500000, -10.500000) "></path>    </g>        </svg>';
    d3.select(this).html(svgHTML);

}
var setupNewSketch = function() {
    //remove info panel
    $('#infoPanel, #mainControls .icon_info, #introPanel, #sideControls').remove();
    $('.forceHide').removeClass('forceHide');

    $('input[name="saveAsNew"]').val('true');
    //activate code panel
    $('#mainControls .icon_code').click();
    $('#editSketchButton').on('click', function() {
        if ($(this).hasClass('selected')) {
            submitSketch();
        } else {
            setupEditSketchPanel();
        }
    })
    $('#forkSketchButton, .navbar .icon_fork').remove();

    sketchChanged = true;
    wannaSave();


}

var setupExistingSketch = function() {
    setupHearts();
    setupEmbed();
    setupShare();

    $('#editSketchButton').on('click', function() {
        if ($(this).hasClass('selected')) {
            submitSketch();
        } else {
            setupEditSketchPanel();
            if (sketch.userID == sessionUser.userID) {
                $('input[name="parentID"]').val(sketch.parentID);
                $('input[name="saveAsNew"]').val('false');
            } else {
                $('input[name="parentID"]').val(sketch.visualID);
                $('input[name="saveAsNew"]').val('true'); //set fork as default saving mode
            }

        }
    })
    $('#forkThisSketchButton').on('click', function() {
        $('#forkThisSketchButton').button('loading');
        setupEditSketchPanel(false);
        $('input[name="parentID"]').val(sketch.visualID);
        $('input[name="saveAsNew"]').val('true');
        submitSketch();

    })

    $('#forkSketchButton').on('click', function() {
        if ($(this).hasClass('selected')) {
            submitSketch();
        } else {
            setupEditSketchPanel();
            $('input[name="parentID"]').val(sketch.visualID);
            $('input[name="saveAsNew"]').val('true');
        }
        return false;
    })


    //show tabs if sketch has multiple tabs
    if (sketch.codeObjects.length > 1) {
        $('#tabMode1').attr('checked', 'checked').trigger('change');
    }

    //delete sketch behavior
    $('#deleteSketchLink').on('click', function() {
        $('#deleteSketchModal').modal('show');
        return false;
    });

    $('#deleteSketchModal .btn-primary').on('click', function() {
        var $btn = $(this).button('loading');

        $.getJSON('/sketch/' + sketch.visualID + '/delete_ajax')
            .done(function(response) {
                var message = response.message;
                OP.showMessageModal(message, function() {
                    window.location.href = '/#sketches'
                });
            })
            .fail(
                function(response) {
                    var message = response.responseJSON ? response.responseJSON.message : response.statusText;
                    OP.showMessageModal(message);
                })
            .always(function(response) {
                $btn.button('reset');
                $('#deleteSketchModal').modal('hide');
            });

    });




}

//submit sketch info to save
var submitSketch = function() {
    var submitForm = new OPLiveForm({
        container: '#editSketchPanel',
        disableOnSubmit: false,
        onFail: function(message) {
            $('#editSketchButton').button('submit');
            OP.showMessageModal("Couldn't save sketch:  " + message);
        },
        onSubmit: function() { //on submit
            $('#editSketchButton').button('loading');
            if (sketch.visualID > 0) {
                if (typeof mixpanel != 'undefined') mixpanel.track("sketch_save_attempt");
            } else {
                if (typeof mixpanel != 'undefined') mixpanel.track("sketch_create_attempt");
            }
        },
        onSuccess: function(response) { //on submit
            clog(response);
            if (response.success) {
                if (sketch.visualID > 0) {
                    if (typeof mixpanel != 'undefined') mixpanel.track("sketch_save_attempt");
                } else {
                    if (typeof mixpanel != 'undefined') mixpanel.track("sketch_create_attempt");
                }
                sketchChanged = false;
                wannaLeave(false);
                window.location.href = '/sketch/' + response.object.visualID;
            }
        },
        submitURL: '/sketch/createSubmit_ajax/'
    });
    submitForm.submit();

}
var setupEditSketchPanel = function(showPanel) {


    sketchEngine.pauseSketch(true);
    sketchConsole.show(false);

    //get canvas screenshot
    try {
        var canvas = $(sketchWindow.document).find("canvas");
        var imgURI = canvas[0].toDataURL("image/png");
        $('#screenshot').css('background-image', 'url(' + imgURI + ')');
        $('#screenshot + input').val(imgURI);
    } catch (e) {
        $('#screenshot').css('background-image', 'none');
        $('#screenshot + input').val('');
    }

    //update with recent code
    //copy code without the editor, to be able to save
    var code = sketch.codeObjects.map(function(d) {
        return {
            'title': d.title,
            'code': d.code,
            'visualCodeID': d.visualCodeID,
            'createdOn': d.createdOn,
            'visualID': d.visualID
        }
    });
    $('#editSketchPanel input[name="codeObjects"]').val(JSON.stringify(code));
    $('#editSketchPanel input[name="imports"]').val(sketch.imports);


    var submitForm = new OPLiveForm({
        container: '#editSketchPanel',
        submitURL: '/sketch/createSubmit/'
    });
    submitForm.enable();

    var licenseDropup = $('#editSketchPanel .dropup');
    //licenseDropup.dropdown();
    $('#editSketchPanel .dropup li').off('click').on('click', function() {
        var licenseName = $(this).text();
        var licenseValue = $(this).attr('data-license');
        $('#editSketchPanel .dropup .dropdown-toggle').text(licenseName);
        $('#editSketchPanel input[name="license"]').val(licenseValue);
        licenseDropup.removeClass('open');
    });
    $('#editSketchPanel .dropup li a').off('click').on('click', function() {
        return false;
    });
    if (showPanel !== false) {
        activatePanel($('#editSketchButton'));
        $('#editSketchButton').button('submit');
        $('#forkSketchButton').hide();
        $('#editSketchPanel .sketchTitle').focus();
    }

    if (sessionUser.membershipType == 0) {
        setupPlus();
    }
}
var setupPlus = function() {

    //disable toggles
    $('#editSketchPanel .plusOnly')
        .off('click')
        .addClass('disabled')
        .next('.description')
        .html('you need to be a <a href="/membership">Plus+ Member</a> to change')
        .css('opacity', 1);
    //disable license selection
    $('#editSketchPanel #licenseDropdown').remove();

    var license = $('#editSketchPanel formItem.license .field');
    license
        .html(license.text())
        .off('click')
}


//=====CODE FUNCTIONS=====

//prepare codeTabs + textarea filled with code
var setupCode = function() {
    //hide code if hidden
    if (+sketch.hideSourceCode && sketch.userID != sessionUser.userID) {
        $('body').addClass('hideSourceCode');
    }


    //sort by creation date
    sketch.codeObjects = sketch.codeObjects.sort(function(a, b) {
        return a.createdOn > b.createdOn ? 1 : -1
    });

    //populate tabs
    var codeTabs = d3.select('#codeTabs ul').selectAll('li').data(sketch.codeObjects, function(d) {
        return d.visualCodeID
    });
    codeTabs.enter()
        .append('li')
        .text(function(d) {
            return d.title
        })
        .classed('selected', function(d, i) {
            return i === 0
        })
        .on('click', function(d, i) {
            var codePanes = d3.selectAll('#codePanel .codePane');
            d3.selectAll('#codeTabs ul li').classed('selected', false);
            d3.select(this).classed('selected', true);
            codePanes.classed('selected', false);
            codePanes.filter(function(c) {
                return c == d
            }).classed('selected', true);
            d.editor.refresh();
        })
        .on('dblclick', function(d, i) { //add textfield on dblclick
            var $t = $(this);
            var self = this;
            if (!$t.hasClass('edit')) {
                $t.attr('contentEditable', 'true')
                    .addClass('edit')
                    .focus()
                    .on('blur', function() {
                        //reset if empty
                        if ($t.text().trim().length === 0) {
                            $t.text(d3.select(this).datum().title);
                        } else {
                            d3.select(this).datum().title = $t.text();
                            sketchChanged = true;
                            wannaSave();
                        }
                        $t.attr('contentEditable', 'false').removeClass('edit');
                    })
                    .on('keydown', function(e) { //disable new line
                        OP.check_charcount(this, 25, e);
                        return e.which != 13;

                    });
            }
            return false;
        })
        .append('div') //close icon for tabs
        .attr('class', 'icon icon_x_small_dark tabCloseButton')
        .on('click', function(d, i) {
            $('#deleteTabModal .btn-primary').on('click', function() {
                sketch.codeObjects = _.without(sketch.codeObjects, d);
                $('#deleteTabModal').modal('hide');
                setupCode();
                $('#codeTabs li:last-of-type').click(); //select the last tab;
            });
            $('#deleteTabModal').modal('show');
        })

    codeTabs.exit().remove();



    //populate panes
    var codePanes = d3.select('#codePanel .codeContainer').selectAll('div.codePane').data(sketch.codeObjects, function(d) {
        return d.visualCodeID
    });
    codePanes.enter()
        .append('div')
        .classed('codePane', true)
        .classed('selected', function(d, i) {
            return i === 0
        })
        .append('textarea')
        .classed("col-md-12 code", true)
        .attr({
            'autocorrect': "off",
            'autocapitalize': "off",
            'spellcheck': "false"
        })
        .text(function(d) {
            return d.code
        })
        .each(function(d) {
            setupEditor(this);
            d.editor.refresh();
        });
    codePanes.exit().remove();

    //set add behavior
    d3.select('#addCodeButton').on('click', null);
    d3.select('#addCodeButton').on('click', function() {
        var tabNo = (sketch.codeObjects.length + 1);
        var newCode = {
            createdOn: OP.dateSQL(),
            title: "tab" + tabNo,
            updatedOn: '',
            visualCodeID: -sketch.visualID - tabNo, //keep minus IDs for new tabs
            visualID: sketch.visualID
        };
        sketch.codeObjects.push(newCode);
        setupCode();
        $('#codeTabs ul li:last').click();
    });

}

var setupEditor = function(textarea) {
    var datum = d3.select(textarea).datum();
    //trim whitespace
    d3.select(textarea)
        .html(function(d) {
            return d3.select(this).html().trim()
        })
    var editor = CodeMirror.fromTextArea(textarea, {
        lineNumbers: true,
        mode: "javascript",
        theme: 'neo'
    });
    //create the editor
    editor.on('blur', function(instance) {
        instance.save();
        datum.code = instance.doc.getValue();
    });
    editor.on('change', function(instance) {
        sketchChanged = codeChanged = true;
        wannaSave();

    });

    editor.refresh();
    d3.select(textarea).datum().editor = editor;
}


var toggleCodeOptions = function() {
    if (codeOptionsEnabled) { //turn off
        $('#codePanel .codeOptions')
            .removeClass('active')
        $('#codePanel .codeContainer, #codeTabs ')
            .removeClass('col-sm-9')
            .addClass('col-sm-12');
    } else {
        $('#codePanel .codeOptions')
            .addClass('active')
        $('#codePanel .codeContainer, #codeTabs ')
            .addClass('col-sm-9')
            .removeClass('col-sm-12');
    }
    codeOptionsEnabled = !codeOptionsEnabled;
}
var setupCodeOptions = function() {
    //setup handle
    $('#codePanel .codeOptions .icon_edit_dark').on('click', function() {
        toggleCodeOptions();
    })

    //setup tabs
    $('.codeOptions .nav-tabs a').click(function(e) {
        e.preventDefault()
        $(this).tab('show');

        //load ajax if not loaded
        if ($(this).attr('href') == '#sketchFiles' && !filesLoaded) {
            setupSketchFiles();
        }

        //load ajax if not loaded
        if ($(this).attr('href') == '#codeReference' && !referenceLoaded) {
            setupCodeReference();
        }



        return false;
    })

    //set sketch Mode
    var firstTime = true; //flag to not mark codechange
    $('#sketchModeOptions input[name="sketchMode"]').on('change', function() {
        sketch.mode = sketch.isPjs = $('#sketchModeOptions input[name="sketchMode"]:checked').val();
        $('#editSketchPanel input[name="mode"]').val(sketch.mode);
        sketchChanged = codeChanged = !firstTime;
        wannaSave();
        //hide ref if not p5js
        d3.select($('a[href="#codeReference"]').parent().get()[0]).classed('hide', +sketch.mode != 2);

        setupEngineVersions();

        //update libraries shown
        setupLibraries();

    });

    //select if pjs or p5js
    $('input[name="sketchMode"][value="' + sketch.isPjs + '"]').click();
    firstTime = false;



    //tab Mode
    $('#tabModeOptions input[name="tabMode"]')
        .on('change', function() {
            //get value as show hide
            tabMode = $('#tabModeOptions input[name="tabMode"]:checked').val();
            d3.select('#codeTabs').classed('show', tabMode === "true");
            d3.select('.codeContainer').classed('tabPadding', tabMode === "true");

        });
    //select the current mode
    $('#tabModeOption0').parent('label').click(); //bounce is the default option

}
var codeReferenceData = [];
var setupCodeReference = function() {
    var dom = d3.select('#codeReference');
    dom.classed('loading',true);
    if (!referenceLoaded) {
        var list = dom.append('div');
        d3.json('/api/reference/p5js', function(ref) {
            dom.classed('loaded', true);
            referenceLoaded = true;
            codeReferenceData = ref.classitems;
            dom.classed('loading',false);
            showCodeReference();
        })
    }
    dom.select('input').on('keyup', function() {
        showCodeReference($(this).val())
    });

}
var showCodeReference = function(find) {
    let filteredData = codeReferenceData;
    filteredData = filteredData
        .filter(function(d) {
            return d.class == 'p5'
        });
    if (typeof find != 'undefined' && find != '') {
        filteredData = filteredData
            .filter(function(d) {
                return typeof d.name != 'undefined' && d.name.indexOf(find) > -1
            });
    }

    let classData = d3.nest()
        .key(function(d) {
            return d.module
        })
        .entries(filteredData);

    //sort and filter out p5.dom and p5.sound
    classData = classData
        .filter(function(d) {
            return d.key != 'undefined' && d.key != 'p5.dom' && d.key != 'p5.sound'
        })
        .sort(function(a, b) {
            return a.key > b.key ? 1 : -1
        });

    let classes = d3.select('#codeReference div').selectAll('ul').data(classData, function(d) {
        return d.key
    });
    classes.enter()
        .append('ul')
        .text(function(d) {
            return d.key
        })
    classes.each(function(d, i) {
        let c = d3.select(this).selectAll('li').data(d.values, function(d) {
            return d.class + d.name
        });
        c.enter()
            .append('li')
            .append('a')
            .attr('href', function(d) {
                //if(!d.name){ clog(d);}
                return 'http://p5js.org/reference/#/p5/' + d.name
            })
            .attr('target', '_blank')
            .text(function(d) {
                return d.name
            })
        c.exit().remove();
        d3.select(this).selectAll('li').sort(function(a, b) {
            return a.name > b.name ? 1 : -1
        });

    })

    classes.exit().remove();
    d3.selectAll('#codeReference ul').sort(function(a, b) {
      return a.key > b.key ? 1 : -1
    });
}
var setupInfoPanel = function() {

    $('#infoPanel .bg').on('click:returnToPlay', function() {
        $('#mainControls .icon_play').click();
    });


    //remove empty fields
    $('#infoPanel .hideIfEmpty').each(function() {
        if ($(this).text().trim().length === 0) {
            $(this).remove();
        }
    });


}

var loadForks = function() {
    var forkList = function(container, data) {
        var li = d3.select(container).append('ul').selectAll('li').data(data)
            .enter()
            .append('li')
            .style('opacity', 0);
        var textContent = li.append('div').classed('textContent', true);
        textContent.append('a')
            .classed('sketchTitle', true)
            .attr('href', function(d) {
                return '/sketch/' + d.visualID
            })
            .text(function(d) {
                return d.title
            });
        textContent.append('span')
            .text('by');
        textContent.append('a')
            .classed('userName', true)
            .attr('href', function(d) {
                return '/user/' + d.userID
            })
            .text(function(d) {
                return d.fullname
            });
        li.each(function(d) {
            if (d.forks.length > 0) {
                forkList(this, d.forks);
            }
        });
    }
    if (!forksLoaded) {
        $('#noForkMessage').text('Loading forks...');
        d3.json('/sketch/' + sketch.visualID + '/getForks_ajax', function(response) {
            sketch.forks = response.object;
            //check if empty
            if (sketch.forks.length > 0) {
                $('#noForkMessage').addClass('hide');
            } else {
                $('#noForkMessage').text('No forks created yet.');

            }
            forkList('#forkListContainer', sketch.forks);
            $('#forkCount').text($('#forkListContainer li').length);

            //transition
            d3.selectAll('#forkListContainer li')
                .transition().duration(function(d, i) {
                    return i * 100;
                })
                .style('opacity', 1);
            forksLoaded = true;
        });
    }
}
var setupComments = function() {

    var textAreaSettings = {
        allowHTML: false, //allow HTML formatting with CTRL+b, CTRL+i, etc.
        allowImg: false, //allow drag and drop images
        singleLine: false, //make a single line so it will only expand horizontally
        pastePlainText: true, //paste text without styling as source
        placeholder: newCommentEmptyValue //a placeholder when no text is entered. This can also be set by a placeholder="..." or data-placeholder="..." attribute
    }
    $('.newComment .textarea')
        .toTextarea(textAreaSettings)
        .toTextarea('enable')
        .on('focus', function() {
            $(this).removeClass('empty');
            $('.newCommentContainer, .comments').addClass('active');
            $('.newComment .buttonContainer')
                .addClass('fadeInFromNone');
        })
        //        .on('keydown', function (e) {
        //            //submit if command+return
        //            if (e.keyCode == 13 && (e.ctrlKey || e.metaKey)) {
        //                $('.newComment .buttonContainer .btn-primary').click();
        //            }
        //        })
        .on('blur', function() {
            // WebKit contentEditable focus bug workaround:
            $('<div contenteditable="true"></div>')
                .appendTo('body').focus().remove()

            if ($(this).text().trim().length === 0) {
                //$('.newComment .buttonContainer').addClass('fadeOutToNone').removeClass('fadeInFromNone');
                $('.newCommentContainer, .comments').removeClass('active');
                $(this).addClass('empty') //.html(newCommentEmptyValue);
            } else {
                $(this).removeClass('empty');
            }
        })
    Mousetrap($('.newComment .textarea')[0]).bind('command+return', function(e) {
        $('.newComment .buttonContainer .btn-primary').click();
        return false;
    });

    //setup code snippets
    setupCodeSnippets();


    //setup submit
    $('.newComment .buttonContainer .btn-primary').on('click', function() {
        $('.newCommentContainer, .comments').removeClass('active');
        //change any <div>s to new line
        var tempContainer = $('.newComment .textarea').clone()
        tempContainer.find('div').html(function() {
            return '&lt;newline&gt;' + $(this).html();
        });
        var commentBody = htmlEntities(tempContainer.text());
        //add back code section
        commentBody = commentBody.replace(/&lt;newline&gt;/g, '<br/>')
        commentBody = commentBody.replace(/&lt;code&gt;/g, '<code>')
        commentBody = commentBody.replace(/&lt;\/code&gt;/g, '</code>');

        $('.newComment .textarea').addClass('loading');
        $.ajax({
                url: '/sketch/' + sketch.visualID + '/postComment_ajax',
                dataType: 'json',
                method: 'post',
                data: {
                    'commentBody': commentBody
                }

            })
            .done(function(result) {
                if (result.success) {
                    appendComment(result.object);
                }
            })
            .fail(function() {
                OP.showMessageModal('There was an error posting your comment. Please try again later');
            })
            .always(function() {
                $('.newComment .textarea').removeClass('loading');
            });

    });

    //setup cancel
    $('.newComment .buttonContainer .btn-secondary').on('click', function() {
        $('.newComment .textarea').html('').trigger('blur');

    });

    //setup flagging behavior
    $('.comments .icon_flag').click(function() {
        var commentID = $(this).closest('.comment').attr('data-commentID');
        $('#flagCommentModal .btn-danger').attr('data-commentID', commentID);
        $('#flagCommentModal').modal();
    })
    $('#flagCommentModal .btn-danger').on('click', function() {
        var $btn = $(this).button('loading');
        var commentID = $btn.attr('data-commentID');
        var type = $btn.attr('data-type');

        $.getJSON('/sketch/' + sketch.visualID + '/flagComment_ajax/' + commentID + '/' + type)
            .done(function(response) {
                var message = response.message;
                OP.showMessageModal(message);
            })
            .fail(
                function(response) {
                    var message = response.responseJSON ? response.responseJSON.message : response.statusText;
                    OP.showMessageModal(message);
                })
            .always(function(response) {
                $btn.button('reset');
                $('#flagCommentModal').modal('hide');
            });

    });



    //setup delete behavior
    $('.comments .icon_delete').click(function() {
        var comment = $(this).closest('.comment');
        var commentID = comment.attr('data-commentID');
        comment
            .animate({
                'height': '0px',
                'opacity': 0
            }, 400)
            .delay(800).queue(function() {
                $(this).remove();
            });

        //do ajax call
        $.getJSON('/sketch/' + sketch.visualID + '/deleteComment_ajax/' + commentID)
            .done(function(response) {
                clog(response);
            })
            .fail(
                function(response) {
                    var message = response.responseJSON ? response.responseJSON.message : response.statusText;
                    OP.showMessageModal(message);

                })
            .always(function(response) {

            });
    })

    //scroll comments to below
    $('.comments').scrollTop($('.comments').get()[0].scrollHeight);


}
var setupCodeSnippets = function() {
    $('.comments code,.library code')
        .off('click')
        .on('click', function() {
            var content = $(this).html();
            $("#codeSnippetModal .modal-body").html(content);
            $("#codeSnippetModal").modal();
        })
}

/* Make the given section copy-able */
var setupCopyArea = function(container) {
    var copyLink = container.find('.copyLink');
    var copyContent = container.find('.copyContent');

    copyLink.on('click', function() {
        var $temp = $("<input>")
        $("body").append($temp);
        $temp.val(copyContent.text()).select();
        document.execCommand("copy");
        $temp.remove();
        copyContent.addClass('flash');
        var self = $(this).text('Copied');
        window.setTimeout(function() {
            copyContent.removeClass('flash');
        }, 100);
        window.setTimeout(function() {
            self.text('Click to Copy');
        }, 5000);
    });
}
var setupEmbed = function() {
    setupCopyArea($('#share_embed'));
}
var setupShare = function() {
    setupCopyArea($('#share_attribute'));
    if (sketch.license && sketch.license != 'none') {
        //setup attribution info
        var attrText = '"' + sketch.title + '" by ' + user.fullname + '\n';
        attrText += 'http://www.openprocessing.org/sketch/' + sketch.visualID + '\n';
        attrText += 'Licensed under ' + sketch.licenseObject.name + '\n';
        attrText += sketch.licenseObject.url + '\n';
        attrText += 'https://creativecommons.org/licenses/GPL/2.0/';
        $('#attributionText').html(attrText);
    } else {
        $('#share_attribute').remove();
    }

}
var setupSketchFiles = function() {
    sketch.files = [];

    if (sketch.userID == sessionUser.userID && sketch.isPjs > 0) {
        //setup drop zone
        Dropzone.autoDiscover = false;
        var dz = new Dropzone("#sketchFiles", {
            url: "/sketch/" + sketch.visualID + "/files",
            parallelUploads: 1,
            maxFilesize: 40,
            acceptedFiles: ".gif,.jpg,.jpeg,.png,.csv,.json,.mov,.ogg,.webm,.mp3,.mp4,.mid,.midi,.wav,.txt,.svg,.otf,.ttf",
            addRemoveLinks: false,
            clickable: '#uploadFileButton'

        });


        dz.on('addedfile', function(file) {
                sketch.files.push({
                    name: file.name,
                    date: file.lastModified,
                    size: file.size
                });
                listFiles();
                d3.selectAll('#sketchFiles li')
                    .filter(function(d) {
                        return d.name == file.name
                    })
                    .classed('inProgress', true)
                    .select('.progressBar')
                    .style('width', '0%');
            })
            .on('uploadprogress', function(file, progress, bytesSent) {
                clog(file, progress);
                d3.selectAll('#sketchFiles li')
                    .filter(function(d) {
                        return d.name == file.name
                    })
                    .classed('inProgress', true)
                    .select('.progressBar')
                    .style('width', progress + '%');
            })
            .on('success', function(file, response) {
                var li = d3.selectAll('#sketchFiles li').filter(function(d) {
                    return d.name == file.name
                })

                //update File name with the one returned from the server
                var newFileName = JSON.parse(response).object.name;
                var d = li.datum();
                d.name = newFileName;
                li.select('a').text(newFileName);
                li
                    .classed('inProgress', false)
                    .select('.progressBar').transition()
                    .delay(500)
                    .style('width', '0%'); //reset progressbar

            })
            .on('error', function(file, mesg) { //client level msg is thrown with mesg
                var message = file.xhr ? JSON.parse(file.xhr.response).object : mesg;
                var li = d3.selectAll('#sketchFiles li').filter(function(d) {
                        return d.name == file.name
                    })
                    .classed('error', true)
                li.select('.errorMessage')
                    .html(message);
                window.setTimeout(function() {
                    sketch.files = sketch.files.filter(function(f) {
                        return f.name != file.name
                    });
                    listFiles();
                }, 10000);

            })
            .on('dragenter', function(e) {
                $('#sketchFiles').addClass('fileOver');
            })
            .on('dragend', function(e) {
                $('#sketchFiles').removeClass('fileOver');
            }).on('drop', function(e) {
                $('#sketchFiles').removeClass('fileOver');
            });
    }


    //list all files
    $.getJSON('/sketch/' + sketch.visualID + '/files/')
        .done(function(response) {
            if (response.object) {
                //object is an 'array' with keys as filenames. Convert to standard array as 0,1,2...
                sketch.files = $.map(response.object, function(value, index) {
                    return [value];
                });;
                //clog(sketch.files);
                listFiles(true);
                filesLoaded = true;
            }
        })
        .fail(
            function(response) {
                var message = response.responseJSON ? response.responseJSON.message : response.statusText;
                clog('error: ', message);
            })
        .always(function(response) {

        });

}

var listFiles = function(exists) {
    //argument exists provides if the initial
    var fileLi = d3.select('#sketchFiles ul').selectAll('li').data(sketch.files, function(d) {
        return d.name;
    });
    fileLiEnter = fileLi
        .enter()
        .append('li')
        .classed('file', true)
        .classed('inProgress', exists != true)


    fileLiEnter.append('a')
        .attr('href', function(d) {
            return '/sketch/' + sketch.visualID + '/files/' + d.name
        })
        .attr('target', '_blank')
        .text(function(d) {
            return d.name
        });
    fileLiEnter.append('span')
        .attr('class', 'fileSize')
        .html(function(d) {
            return '&nbsp;- ' + Math.round(d.size / 1024 / 1024 * 100) / 100 + ' mb'; //round to single decimal
        });
    fileLiEnter.append('div')
        .classed('icon_delete', true)
        .on('click', function(d) {
            deleteFile(d);
            sketch.files = sketch.files.filter(function(f) {
                return f.name != d.name
            });
            listFiles();
        });
    fileLiEnter.append('div')
        .classed('errorMessage', true);
    fileLiEnter.append('div')
        .classed('progressBar', true)

    fileLi.selectAll('progressBar')
        .style('width', '0%');

    fileLi.exit().transition().style('opacity', 0).remove();

}
var deleteFile = function(d) {
    //remove given file
    $.ajax({
            url: '/sketch/' + sketch.visualID + '/files/',
            cache: false,
            dataType: 'json',
            method: 'post',
            data: {
                action: 'delete',
                filename: d.name
            }
        })
        .done(function(response) {
            clog(response);
        })
        .fail(function(response) {

        })
        .always(function(response) {

        });
}
var appendComment = function(commentBody) {
    //scroll comments to bottom
    $('.comments').scrollTop($('.comments').get()[0].scrollHeight);
    var template = $('.comment.template').clone();

    template.find('.commentBody').html(commentBody);
    template.find('.commentDate').html('Just now');
    //TODO: check for <code> tag here
    template.removeClass('template').appendTo('.comments');

    //reset new comment box
    $('.newComment .textarea')
        .html('').blur()
    //.html(newCommentEmptyValue)



    setupCodeSnippets();

    //smooth scroll comments to bottom to reveal
    $('.comments').animate({
        scrollTop: $('.comments').get()[0].scrollHeight
    }, 1000);
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var activatePanel = function(icon) {

    $('#mainControls .icon').removeClass('selected');
    $('#editSketchButton').removeClass('selected');
    $(icon).addClass('selected');

    var target = $(icon).attr('data-target');
    //show panel
    $('.panel, #sketch').removeClass('active').addClass('inactive');
    $(target).removeClass('inactive').addClass('active');
}

var setupControls = function() {
    //MAIN CONTROLS


    $('#mainControls .icon_info').on('click', function() {
        sketchEngine.slowdownSketch(false);
        sketchEngine.pauseSketch(true);

        sketchConsole.show(false); //hide the console
        //if owner, show Edit button
        if (sketch.userID == sessionUser.userID) {
            $('#sideControls').hide();
            $('#editSketchButton').button('edit').show();
            $('#forkSketchButton').hide();
            $('#sideButtons').show();

        } else {
            $('#sideControls').show();
            $('#sideButtons').hide();
        }

        activatePanel(this);
        OP.setupImageLoading('#infoPanel .userThumb');
        $('body').scrollTop(0)
        $('.navbar').removeClass('fade2Sketch');
    })
    $('#mainControls .icon_code').on('click', function() {
        sketchEngine.pauseSketch(true);
        activatePanel(this);
        //sketchConsole.show(true);

        wannaSave();
        sketch.codeObjects.forEach(function(d) {
            d.editor.refresh();
        });
        $('body').scrollTop(0);
        $('.navbar').removeClass('fade2Sketch');
    })
    $('#mainControls .icon_play').on('click', function() {
        updateSketchImports()
        sketchEngine.pauseSketch(false);
        sketchEngine.slowdownSketch(false);
        activatePanel(this);

        if ($(this).hasClass('selected')) {
            //if it is the active tab, just play/pause the sketch
            //sketchEngine.pauseSketch(sketchPlaying);
            sketchConsole.clear();
            sketchEngine.restartSketch();
        } else {

            //if it is not active tab, then become active, and reload sketch if code is changed
            if (codeChanged) {
                sketchConsole.clear();
                sketchEngine.runSketch();
                codeChanged = false;
            }
            //sketchConsole.show(true); //hide the console


        }
        wannaSave();
        $('#sideControls').show();




        $('.navbar').addClass('fade2Sketch');
        $('body').scrollTop(0)
    });

    //SIDE CONTROLS
    $('#sideControls .metric').on('click', function() {
        toggleSidePanel(this);
        if ($(this).attr('data-target') == "#forkSidePanel") {
            //ajax load forks data;
            loadForks();
        }
        if ($(this).attr('data-target') == "#heartSidePanel") {
            //ajax load forks data;
            OP.setupImageLoading('#heartSidePanel .userThumb');
        }
    })

    $('#sideControls .icon_heart').on('click', heartSketch);



    //on comment, open comment panel, and put cursor on comment box
    $('#sideControls .icon_comment').on('click', function() {
        var self = this;
        $(this).next('.metric').click();
        window.setTimeout(function() {
            if ($(self).parent().hasClass('selected')) {
                $('.newComment .textarea').get(0).focus(); //chrome fix
                //$('.newComment .textarea').focus();

            } else {
                $('.newComment .textarea').blur();
            }

        }, 200);

    })
    $('#sideControls .icon_fork').on('click', function() {
        $(this).next('.metric').click();
    });
    $('#sideControls .icon_share').on('click', function() {
        $(this).next('.metric').click();

    });

    //Fullscreenbutton
    $('.icon_fullscreen').click(function() {
        $(this).toggleClass('selected');
        $('body').toggleClass('fullscreen');

    });


}

var toggleSidePanel = function(container) {
    //unselect others
    $('#sideControls .metric').not(container).parent().removeClass('selected');

    //toggle select for the current one
    $(container).parent().toggleClass('selected');


    //show panel
    var target = $(container).attr('data-target');
    $('.sidePanel').not(target).removeClass('active').addClass('inactive');
    $(target).toggleClass('active').toggleClass('inactive');

    //setup navbar hide behavior on select/unselect
    if ($('.metricGroup.selected').length > 0) {
        $('.navbar').removeClass('fade2Sketch');
        $('.navbar').addClass('opaque');
    } else if ($('#mainControls .icon_play').hasClass('selected')) {
        $('.navbar').addClass('fade2Sketch');
        $('.navbar').removeClass('opaque');
    }
}
var setupHearts = function() {
    //d3.select('#heartsList')
    OP.listUsers('#heartsList', sketch.hearts, 'col-xs-4 col-md-3', false, false);
}
//checks if user already hearted the sketch already. toggles the heart accordingly.
var checkHeart = function() {
    var heartedUsers = sketch.hearts.filter(function(d) {
        return +d.userID == sessionUser.userID
    });
    if (heartedUsers.length > 0) {
        $('#sideControls .icon_heart').addClass('selected');
        $('#sideControls .icon_arrowToHeart').addClass('shoot');
    }

}
var toggleHeart = function() {
    var heartSketch;
    var icon = $('#sideControls .icon_heart');
    icon.toggleClass('selected');
    $('#sideControls .icon_arrowToHeart').toggleClass('shoot');
    var val;
    if (icon.hasClass('selected')) { //heart the sketch
        val = icon.siblings('.metric').text();
        val = (+val > 0) ? +val + 1 : 1;
        icon.siblings('.metric').text(val);
        heartSketch = true;
    } else {
        val = icon.siblings('.metric').text();
        val = (+val > -1) ? +val - 1 : 0;
        icon.siblings('.metric').text(val);
        heartSketch = false;
    }
    return heartSketch;
}

//Parent Function: toggles the heart, runs ajax, and undos if ajax fails
var heartSketch = function() {
    if (+sessionUser.userID === 0) {
        window.location.href = '/home/signin?prevUrl=/sketch/' + sketch.visualID;
    } else {
        var heartSketch = toggleHeart();

        //do ajax call
        $.getJSON('/sketch/' + sketch.visualID + '/heart/' + heartSketch)
            .done(function(response) {
                clog(response);
            })
            .fail(
                function(response) {
                    var message = response.responseJSON ? response.responseJSON.message : response.statusText;
                    OP.showMessageModal(message);
                    toggleHeart();
                })
            .always(function(response) {

            });
    }
}

//checks if sketchChanged and if so, presents the proper button
var wannaSave = function() {
    wannaLeave(sketchChanged);
    //if owner, show save button if code changed
    if (sketch.userID == sessionUser.userID) {
        if (sketchChanged) {
            //$('#sideControls').hide();
            $('#editSketchButton').button('save').show();
            $('#forkSketchButton').show();
            $('#sideButtons').show();

        } else {
            $('#sideControls').show();
            $('#sideButtons').hide();

        }
    } else { //if guest
        if (sketchChanged) {
            //$('#sideControls').hide();
            $('#forkSketchButton').hide();
            $('#editSketchButton').button('fork');
            $('#sideButtons').show();
        } else {
            $('#sideControls').show();
            $('#sideButtons').hide();

        }
    }

}
var wannaLeave = function(bool) {
    if (bool === true) {
        $(window).on("beforeunload", function(e) {
            var confirmationMessage = "You made changes on sketch, but didn't save yet.";

            (e || window.event).returnValue = confirmationMessage; //Gecko + IE
            return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
        });
    } else {
        $(window).off("beforeunload");
    }
}
