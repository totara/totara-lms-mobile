var templates = [
    "root/externallib/text!root/plugins/program/program.html"
];

define(templates, function(programTpl) {
    var plugin = {
        settings: {
            name: "program",
            type: "user",
            title: "",
            icon: "",
            lang: {
                component: "core"
            }
        },

        templates: {
            program: { html: programTpl }
        },

        routes: [,
            ["programs/:programID", "program", "program"]
        ],

		storage: {
            programModule: {type: "model"},
            programModules: {type: "collection", model: "programModule"}
        },

        currentprogramInfo: null,

        sizes: undefined,

        _getSizes: function() {
            MM.plugins.program.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:$(document).innerWidth(),
                    left:0
                }
            };
        },

        resize: function() {
            if (MM.plugins.program.sizes == undefined) {
                MM.plugins.program._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.program.sizes.withSideBar.center,
                    'left':MM.plugins.program.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.program.sizes.withoutSideBar.center,
                    'left':MM.plugins.program.sizes.withoutSideBar.left
                });
            }
            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        program: function(programID) {
            MM.panels.show("center", "PROGRAM PLUGIN");
            var method = "totara_program_get_program";
            var data = { programid: programID, userid: MM.site.get("userid") };
            var callback = MM.plugins.program.programCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.program.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        programCallback: function(response) {
            console.log(response);
        },

        errorCallback: function(error) {
            MM.log(error);
        }
    }

    MM.registerPlugin(plugin);
});
