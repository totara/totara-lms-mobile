var templates = [
    "root/externallib/text!root/plugins/tasks/layout.html"
];

define(templates, function(layoutTpl) {
    var plugin = {
        settings: {
            name: "tasks",
            type: "general",
            icon: "img/totara/icon/tasks.png",
            alticon: "img/totara/icon/tasks-grey.png",
            lang: {
                component: "core"
            },
            menuURL: "#tasks"
        },

        templates: {
            layout:layoutTpl
        },

        routes: [
            ["tasks", "main", "main"]
        ],

        sizes: undefined,

        _getSizes: function() {

            // Default tablet.
            MM.plugins.tasks.sizes = {
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
                MM.plugins.tasks.sizes = {
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
            if (MM.plugins.tasks.sizes == undefined) {
                MM.plugins.tasks._getSizes();
            }

            if (MM.deviceType === "tablet") {
                if (MM.navigation.visible === true) {
                    $("#panel-center").css({
                        'width':MM.plugins.tasks.sizes.withSideBar.center,
                        'left':MM.plugins.tasks.sizes.withSideBar.left
                    });
                } else {
                    $("#panel-center").css({
                        'width':MM.plugins.tasks.sizes.withoutSideBar.center,
                        'left':MM.plugins.tasks.sizes.withoutSideBar.left
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
        },

        _getTasks: function() {
            var method = "tm_totara_message_get_tasks";
            var data = {
                'options': [
                    {'name': 'markseenonmobile', 'value': true},
                    {'name': 'limit', 'value': false}
                ]
            };
            var callback = MM.plugins.tasks._getTasksSuccess;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.tasks._getTasksFailure;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        _getTasksSuccess: function(data) {
            var tasks = data;

            // Replace URLS with anchor elements
            var anchorRegex = /(http[^ ]+)/g;
            var anchorReplace = '<a href="$1" class="task-link">$1</a>';
            _.each(tasks, function(task) {
                task.fullmessage = task.fullmessage.replace(anchorRegex, anchorReplace);
            });

            $("#menu-items-new-tasks").css('visibility', 'hidden');
            $("#top-menu-items-new-tasks").css('visibility', 'hidden');
            var values = {
                'tasks': tasks
            };
            var html = MM.tpl.render(
                MM.plugins.tasks.templates.layout, values, {}
            );
            MM.panels.show('center', html, {hideRight: true});
            $(document).find('.task.accept').on(
                MM.clickType, MM.plugins.tasks._acceptTask
            );
            $(document).find('.task.reject').on(
                MM.clickType, MM.plugins.tasks._rejectTask
            );
            MM.util.setupAccordion($("#panel-center"));
        },

        _getTasksFailure: function() {

        },

        _acceptTask: function(e) {
            e.preventDefault();
            var element = $(e.target);
            var messageId = element.data('messageid');

            var method = "tm_totara_message_accept_task";
            var data = {'messageid':messageId };
            var callback = MM.plugins.tasks._acceptTaskSuccess;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.tasks._acceptTaskFailure;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);

            return false;
        },

        _acceptTaskSuccess: function(data) {
            $(document).find("li.nav-item[data-messageid=" + data + "]").remove();
        },

        _acceptTaskFailure: function() {

        },

        _rejectTask: function(e) {
            e.preventDefault();
            var element = $(e.target);
            var messageId = element.data('messageid');
            var method = "tm_totara_message_reject_task";
            var data = {'messageid':messageId };
            var callback = MM.plugins.tasks._rejectTaskSuccess;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.tasks._rejectTaskFailure;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        _rejectTaskSuccess: function(data) {
            $(document).find("li.nav-item[data-messageid=" + data + "]").remove();
        },

        _rejectTaskFailure: function() {

        },

        main: function() {
            MM.panels.showLoading("center");
            MM.assignCurrentPlugin(MM.plugins.tasks);
            MM.plugins.tasks._getTasks();
        }
    }

    MM.registerPlugin(plugin);
});
