var templates = [ "root/externallib/text!root/plugins/mycourses/mycourses.html"
];

define(templates, function(myCoursesTpl, participantsTpl, participantTpl) {
    var plugin = {
        settings: {
            name: "mycourses",
            type: "general",
            lang: {
                component: "core"
            },
            menuURL: "#my-courses",
        },

        templates: {
            myCourses: { html: myCoursesTpl }
        },

        routes: [
            ["my-courses", "myCourses", "myCourses"]
        ],

        sizes: undefined,

        _getSizes: function() {
            MM.plugins.sizes = {
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
            if (MM.plugins.pluginname.sizes == undefined) {
                MM.plugins.pluginname._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.pluginname.sizes.withSideBar.center,
                    'left':MM.plugins.pluginname.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.pluginname.sizes.withoutSideBar.center,
                    'left':MM.plugins.pluginname.sizes.withoutSideBar.left
                });
            }
            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        myCourses: function() {
            MM.panels.showLoading("center");
            MM.moodleWSCall(
                method = "core_enrol_get_users_course_completions",
                data = { userid: MM.site.get("userid") },
                callback = MM.plugins.mycourses.myCoursesCallback, 
                preSets = { omitExpires: true, cache: false },
                errorCallBack = MM.plugins.mycourses.errorCallback
            );
        },

        myCoursesCallback: function(response) {
            var courses = response;
            var template = MM.plugins.mycourses.templates.myCourses;
            var context = { courses: courses };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
        },

        errorCallback: function(error) {
            MM.log(error);    
        }
    }

    MM.registerPlugin(plugin);
});
