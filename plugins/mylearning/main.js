var templates = [
    "root/externallib/text!root/plugins/mylearning/layout.html"
];

define(templates, function(layoutTpl) {
    var plugin = {
        settings: {
            name: "mylearning",
            type: "general",
            title: "My Learning",
            icon: "img/totara/icon/my-learning.png",
            lang: {
                component: "core"
            },
            menuURL: "#my-learning"
        },

        templates: {
            layout:layoutTpl
        },

        routes: [
            ["my-learning", "main", "main"]
        ],

        sizes: undefined,

        _getSizes: function() {

            // Default tablet.
            MM.plugins.mylearning.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:"100%",
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.mylearning.sizes = {
                    withSideBar: {
                        center:0,
                        left:0
                    },
                    withoutSideBar: {
                        center:"100%",
                        left:0
                    }
                };
            }
        },

        resize: function() {
            if (MM.plugins.mylearning.sizes == undefined) {
                MM.plugins.mylearning._getSizes();
            }

            if (MM.deviceType === "tablet") {
                if (MM.navigation.visible === true) {
                    $("#panel-center").css({
                        'width':MM.plugins.mylearning.sizes.withSideBar.center,
                        'left':MM.plugins.mylearning.sizes.withSideBar.left
                    });
                } else {
                    $("#panel-center").css({
                        'width':MM.plugins.mylearning.sizes.withoutSideBar.center,
                        'left':MM.plugins.mylearning.sizes.withoutSideBar.left
                    });
                }
            } else if (MM.deviceType === "phone") {
                $("#panel-center").css({
                    'width':'100%',
                    'left':0
                });
            }

            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
            MM.plugins.mylearning._removeListeners();
        },

        _removeListeners: function() {
            $(document).off('section_loaded');
        },

        courses:undefined,
        programs:undefined,
        learning:undefined,

        _getCourses: function() {
            var method = "totara_program_get_users_courses";
            var data = { userid: MM.site.get("userid") };
            var callback = MM.plugins.mylearning._getCoursesSuccess;
            var preSets = { omitExpires: true, cache: false };
            var errorCallBack = MM.plugins.mylearning._getCoursesFailure;
            MM.moodleWSCall(method, data, callback, preSets, errorCallBack);
        },

        _getCoursesSuccess: function(data) {
            MM.plugins.mylearning.courses = data;
            $(document).trigger('section_loaded');
        },

        _getCoursesFailure: function() {
        },

        _getPrograms: function() {
            var method = "totara_program_get_users_programs";
            var data = { userid: MM.site.get("userid") };
            var callback = MM.plugins.mylearning._getProgramsSuccess;
            var preSets = { omitExpires: true, cache: false };
            var errorCallBack = MM.plugins.mylearning._getProgramsFailure;
            MM.moodleWSCall(method, data, callback, preSets, errorCallBack);
        },

        _getProgramsSuccess: function(data) {
            MM.plugins.mylearning.programs = data;
            $(document).trigger('section_loaded');
        },

        _getProgramsFailure: function() {

        },

        _getRequiredLearning: function() {
            var method = "totara_program_get_users_required_programs";
            var data = { userid: MM.site.get("userid") };
            var callback = MM.plugins.mylearning._getRequiredLearingSuccess;
            var preSets = { omitExpires: true, cache: false };
            var errorCallBack = MM.plugins.mylearning._getRequiredLearningFailure;
            MM.moodleWSCall(method, data, callback, preSets, errorCallBack);
        },

        _getRequiredLearingSuccess: function(data) {
            MM.plugins.mylearning.learning = data;
            $(document).trigger('section_loaded');
        },

        _getRequiredLearningFailure: function() {

        },

        main: function() {
            MM.resetMenuItemsIndicator(MM.plugins.mylearning.settings.name);

            MM.assignCurrentPlugin(MM.plugins.mylearning);
            MM.panels.showLoading("center");

            $(document).on('section_loaded', MM.plugins.mylearning._sectionLoaded);

            // Put your code here
            MM.plugins.mylearning._getCourses();
            MM.plugins.mylearning._getPrograms();
            MM.plugins.mylearning._getRequiredLearning();
        },

        _sectionLoaded: function() {
            if (MM.plugins.mylearning.courses !== undefined &&
                MM.plugins.mylearning.programs !== undefined &&
                MM.plugins.mylearning.learning !== undefined
            ) {
                MM.plugins.mylearning._removeListeners();
                var values = {
                    'courses':MM.plugins.mylearning.courses,
                    'programs':MM.plugins.mylearning.programs,
                    'learning':MM.plugins.mylearning.learning,
                    title:MM.plugins.mylearning.settings.title
                };
                var html = MM.tpl.render(
                    MM.plugins.mylearning.templates.layout, values, {}
                );
                MM.panels.show('center', html, {hideRight: true});
                MM.util.setupAccordion($("#panel-center"));
                MM.util.setupBackButton();
            }
        }
    }

    MM.registerPlugin(plugin);
});
