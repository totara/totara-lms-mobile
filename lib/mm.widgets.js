// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

/**
 * @fileoverview Moodle mobile html widgets lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile html widgets functionality.
 */
MM.widgets = {

    eventsRegistered: {},

    render: function(elements) {
        var settings = [];
        var output = "";

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }

        $.each(settings, function(index, setting) {
            var renderer = "render" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[renderer] != "undefined") {
                output += "<div class=\"mm-setting\">" + MM.widgets[renderer](setting) + "</div>";
            }
        });

        return output;
    },

    renderList: function(elements) {
        var settings = [];
        var output = '<ul class="nav nav-v">';

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }

        $.each(settings, function(index, setting) {
            var renderer = "render" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[renderer] != "undefined") {
                output += '<li class="nav-item">' + MM.widgets[renderer](setting) + '</li>';
            }
        });

        output += "</ul>";

        return output;
    },

    renderCheckbox: function(el) {
        if (el.checked) {
            el.checked = 'checked = "checked"';
        } else {
            el.checked = '';
        }
        var tpl = '<div class="checkbox-setting-s"><div class="checkbox-label-s"> <%= label %></div><div class="checkbox-tic-s"><input type="checkbox" id="<%= id %>" <%= checked %>/>\
                   <label for="<%= id %>"></label></div></div>';

        return MM.tpl.render(tpl, el);
    },

    renderButton: function(el) {
        if (typeof el.url == "undefined") {
            el.url = "";
        }
        var tpl = '<a href="#<%= url %>" id="<%= id %>"><button><%= label %></button></a>';

        return MM.tpl.render(tpl, el);
    },

    renderSpinner: function(el) {
        var tpl = '\
        <div style="float: right; text-align: right; width: 80px; padding-top: 2px;" id="<%= id %>">\
            <button class="plus"  style="width: 30px; height: 30px; padding: 0px">+</button>\
            <button class="minus" style="width: 30px; height: 30px; padding: 0px; margin-left: 4px">-</button>\
        </div>\
        <div style="margin-right: 80px"><label for="<%= id %>-text"><%= label %></label>\
            <input type="text" value = "'+ MM.getConfig(el.id) +'" id="<%= id %>-text" style="border: 0; color: #f6931f; font-weight: bold;" readonly="readonly"/>\
        </div><div style="clear: both"></div>';

        return MM.tpl.render(tpl, el);
    },

    enhanceButton: function(id) {
        //$("#" + id).button();
    },

    enhanceCheckbox: function(id) {
        //$("#" + id).parent().addClass("checkbox-tic");
    },

    enhanceSpinner: function(id, config) {
        // Nothing.
        $("#" + id + " .plus" ).click(config.clickPlus);
        $("#" + id + " .minus").click(config.clickMinus);
    },

    enhance: function(elements) {
        var settings = [];
        var output = "";

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }

        $.each(settings, function(index, setting) {
            var enhancer = "enhance" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[enhancer] != "undefined") {
                if (setting.config) {
                    MM.widgets[enhancer](setting.id, setting.config);
                } else {
                    MM.widgets[enhancer](setting.id);
                }
            }
        });
        //MM.widgets.improveCheckbox();
    },

    addHandlers: function(elements) {
        var settings = [];
        var output = "";

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }

        $.each(settings, function(index, setting) {
            if (typeof setting.handler != "undefined") {
                var fn = setting.handler;
                var eHandler = function(e){
                    fn(e, setting);
                };
                $("#" + setting.id).bind(MM.clickType, eHandler);
                MM.widgets.eventsRegistered["#" + setting.id] = eHandler;
            }
        });
    },

    dialog: function(text, options) {
        if (!options) {
            options = {
                title: "",
                autoclose: 0
            };
            options.buttons[MM.lang.s('close')] = MM.widgets.dialogClose;
        }
        if (!options.buttons) {
            options.buttons = {};
            options.buttons[MM.lang.s('close')] = MM.widgets.dialogClose;
        }
        $("#app-dialog .modalHeader, #app-dialog .modalContent, #app-dialog .modalFooter").html("");

        $("#app-dialog .modalHeader").html(options.title);
        $("#app-dialog .modalContent").html(text);

        if (options.buttons) {
            var buttons = "";
            // If options.buttons == {} then it's true, but els won't be
            // incremented. So a value of 1 is needed to avoid a div by 0 error
            // later.
            var els = 1;
            $.each(options.buttons, function (key, value) {
                buttons += "<button class=\"modal-button-" + els + "\" style=\"width: _width_%\"> " + key + " </button>"
                els++;
            });
            var width = 100 / els;
            buttons = buttons.replace(/_width_/ig, width);
            $("#app-dialog .modalFooter").html(buttons);

            // Handlers for buttons.
            // We don't attach the listeners until a second after this function
            // has completed because on the iPhone, a button that caused the
            // dialog box to open would also click any buttons in the same area
            // on the dialog box once opened. Further, we throttle the function
            // so that the first call to the button can only be made 1 second
            // after the button has had the click listener attached. This is
            // because, with just the throttle, the first click was being
            // held in a queue and then fired a second later.
            // The desired functionality is that the dialog box remained open
            // if a click event occurred too soon after the box was rendered.
            // 'soon' is defined as 1 second.
            if (MM.deviceOS == 'ios') {
                setTimeout(function() {
                    els = 1;
                    $.each(options.buttons, function (key, value) {
                        $(".modal-button-" + els).click(
                            _.throttle(
                                function(e) {
                                    e.preventDefault();
                                    value();
                                }
                                ,1000, {leading:false})
                            );
                        els++;
                    });
                }, 1000);
            } else {
                els = 1;
                $.each(options.buttons, function (key, value) {
                    $(".modal-button-" + els).click(function(e) {
                        e.preventDefault();
                        value();
                    });
                    els++;
                });
            }
        }

        if (options.marginTop) {
            $("#app-dialog > div").css('margin-top', options.marginTop);
        } else {
            MM.widgets.dialogSetTop();
        }

        // Show the div.
        $("#app-dialog").css('opacity', '1');
        $('html').attr('style','overflow:hidden;width:100%;');
        // Allow mouse events in this div.
        $("#app-dialog").css('pointer-events', 'auto');

        if (options.autoclose) {
            setTimeout(function() {
                MM.widgets.dialogClose();
            }, options.autoclose);
        }

        $("#app-dialog .modalContent input").bind("focus", MM.widgets.delayedDialogSetTop); 
        $("#app-dialog .modalContent input").bind("blur", MM.widgets.delayedDialogSetTop); 
    },

    dialogSetTop: function() {
        // ToDo.  If options.marginTop is set when calling the dialog, we need to use this.
        // Similar to options.width.
        var viewPortHeight = window.outerHeight;
        var dialogHeight = $("#app-dialog > div").height();

        // Dialogs are positioned at the top of the screen if we are using a phone.
        if (matchMedia('only screen and (max-width : 320px) and (orientation : portrait)').matches
            || matchMedia('only screen and (max-width : 640px) and (orientation : landscape)').matches) {
            $("#app-dialog > div").css('margin-top', 0);
        } else {
            var topPx = (viewPortHeight - dialogHeight) / 2;
            var topPc = (topPx / viewPortHeight) * 100;
            $("#app-dialog > div").css('margin-top', topPc + '%');
        }
    },

    delayedDialogSetTop: function() {
        // Handle input focus events - wait 500ms for software keyboard to 
        // potentially show or hide before setting dialog top position.
        setTimeout(MM.widgets.dialogSetTop, 500);
    },

    dialogClose: function() {
        // Hide the div.
        $("#app-dialog").css('opacity', '0');
        // Allow the page to scroll again.
        $('html').removeAttr('style');
        // No mouse events in this div.
        $("#app-dialog").css('pointer-events', 'none');
        $("#app-dialog .modalContent input").unbind("focus", MM.widgets.delayedDialogSetTop); 
        $("#app-dialog .modalContent input").unbind("blur", MM.widgets.delayedDialogSetTop); 
    },

    // TODO: Never called - consider removing?
    improveCheckbox: function() {
        var onClass = "ui-icon-circle-check", offClass = "ui-icon-circle-close";

        $( "input:checked[type=checkbox] " ).button({ icons: {primary: onClass} });
        $( "input[type=checkbox]:not(:checked)" ).button({ icons: {primary: offClass} });

        $( "input[type=checkbox]" ).bind(MM.clickType, function(){

            var swap = function(me, toAdd, toRemove) {
                // find the LABEL for the checkbox
                // ... which should be _immediately_ before or after the checkbox
                var node = me.next();

                // and swap
                node.children(".ui-button-icon-primary")
                    .addClass(toAdd)
                    .removeClass(toRemove);
                ;
            };

            var me = $(this);
            if (me.is(':checked')) {
                swap($(this), onClass, offClass);
            } else {
                swap($(this), offClass, onClass);
            }
        });
    },

    parseMoodleRatedMultiChoice: function(presentation, additionalclasses, options, selected) {
        if (!_.isObject(options)) {
            options = {};
        }

        var regex = /([a-zA-Z0-9 ]+)/ig;
        var matches = presentation.match(regex);

        // Expect something like...
        //     c>>>>>One|Two|Three<<<<<1
        // ...or...
        //     'r>>>>>One|Two|Three'
        // ...parse to an array like...
        //     ['One', 'Two', 'Three']
        var matches = presentation.split(">>>>>", 2)[1].split("<<<<<", 2)[0].split("|");

        var selectElement = $("<select>").addClass(
            additionalclasses.join(" ")
        ).attr(options);

        for (var i=0; i<matches.length; i++) {
            /// String will be in format 'val####name'
            var pieces = matches[i].split('####', 2);
            var val = pieces[0];
            var name = pieces[1];
            selectElement.append(
                $("<option>").html(name).attr('value', val)
            );
        }

        var selected = selected.split("|");
        _.each(selected, function(select) {
            selectElement.find("option[value=" + select + "]").attr('selected', 'selected');
        });

        var html = $("<div>").append(selectElement);

        return html.html();
    },

    parseMoodleMultiChoice: function(presentation, additionalclasses, options, selected) {
        if (!_.isObject(options)) {
            options = {};
        }

        // Displayhidden will have the value 'h' in it if the option is to be omitted. By
        // default all multichoice options should have this as an option.
        var displayHidden = _.has(options, 'displayhidden') && options['displayhidden'] === 'h';
        if (_.has(options, 'displayhidden')) {
            options = _.omit(options, 'displayhidden');
        }

        // Expect something like...
        //     c>>>>>One|Two|Three<<<<<1
        // ...or...
        //     'r>>>>>One|Two|Three'
        // ...parse to an array like...
        //     ['One', 'Two', 'Three']
        var matches = presentation.split(">>>>>", 2)[1].split("<<<<<", 2)[0].split("|");

        var row = presentation[0] === 'r';
        var column = presentation[0] === 'c';
        var dropdown = presentation[0] === 'd';

        var selectElement = $("<select>").addClass(
            additionalclasses.join(" ")
        ).attr(options);
        if (column === true) {
            selectElement.attr('multiple', 'multiple');
        }

        if (displayHidden === false) {
            selectElement.append(
                $("<option>").html("No selected option").attr('value', '')
            );
        }

        for (var i=0; i<matches.length; i++) {
            selectElement.append(
                $("<option>").html(matches[i]).attr('value', i+1)
            );
        }
        var selected = selected.split("|");
        _.each(selected, function(select) {
            selectElement.find("option[value=" + select + "]").attr('selected', 'selected');
        });

        var html = $("<div>").append(selectElement);

        return html.html();
    },

    /**
     * Converts byte value to megabytes.
     * @param value expected in bytes
     * @returns {string} rounded to two decimal places
     */
    toMegabytes: function(value) {
        return ((value / 1024) / 1024).toFixed(2);
    },

    /**
     * Formats a date in DD[st, nd, rd, th] MMMM YYYY @ HH:MM
     * @param date expected in milliseconds
     * @returns {string}
     */
    formatDate: function(date) {

        var months = [
            MM.lang.s('january'),
            MM.lang.s('february'),
            MM.lang.s('march'),
            MM.lang.s('april'),
            MM.lang.s('may'),
            MM.lang.s('june'),
            MM.lang.s('july'),
            MM.lang.s('august'),
            MM.lang.s('september'),
            MM.lang.s('october'),
            MM.lang.s('november'),
            MM.lang.s('december'),
        ];

        var d = new Date(parseInt(date) * 1000);

        var day = d.getDate();
        var month = months[d.getMonth()];
        var year = d.getFullYear();
        var time = d.toLocaleTimeString();

        var ordinal = "th";
        var endChar = day.toString().substr(-1);

        if (endChar === "1") {
            ordinal = "st";
        } else if (endChar === "2") {
            ordinal = "nd";
        } else if (endChar === "3") {
            ordinal = "rd";
    }

        var dateString = day + ordinal + " " + month + " " + year + " @ " + time;

        return dateString;
    }
}
