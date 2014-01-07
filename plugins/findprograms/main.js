var requires = [
    "root/externallib/text!root/plugins/findprograms/findprograms.html"
];

define(requires, function(programsTpl) {

    var callbacks = {
        collate_categories_and_programs: function(data) {
            var missing_categories = false;
            // Get all the categories with all their correct programs below
            // them.
            var categories = _.reduceRight(data, function(memo, program) {
                if (program.categoryid === 0) return memo;

                var category = MM.db.get(
                    'categories', program.categoryid
                );
                if (category !== undefined) {
                    var categoryName = category.get('name');

                    if (memo[category.get('id')] === undefined){
                        memo[category.get('id')] = {
                            'programs':[],
                            'subcategories':[]
                        };
                    }

                    memo[category.get('id')].categoryName = categoryName;
                    memo[category.get('id')].programs.push(program);
                } else {
                    missing_categories = true;
                }

                return memo;
            }, {});

            // If we're missing categories then we'll be returning false.
            // Otherwise, go through all the categories, and move them under
            // the appropriate parent if applicable.
            if (missing_categories === true) {
                categories = false;
            } else {
                // Do moving.
                var moved = true;
                while (moved == true) {
                    moved = false;
                    var keys = _.keys(categories);
                    for (var i = keys.length; i >= 0; i--) {
                        // Undefined categories have already been sorted.
                        if (categories[keys[i]] == undefined) {
                            continue;
                        }
                        var category = MM.db.get('categories', keys[i]);
                        if (category !== undefined) {
                            if (category.get('parent') != 0) {
                                categories[category.get('parent')].subcategories.push(
                                    category
                                );
                                moved = true;
                                categories[category.get('id')] = undefined;
                            }
                        }
                    }
                }
            }

            return categories;
        },

        find_programs_successful:function(data) {
            var categories = callbacks.collate_categories_and_programs(data);

            if (categories !== false) {
                var values = {
                    'categories' : categories,
                    'title': MM.plugins.findprograms.settings.title
                };
                var html = MM.tpl.render(
                    MM.plugins.findprograms.templates.results.html, values, {}
                );
                MM.panels.show('center', html, {hideRight: false});
                MM.util.setupAccordion($("#panel-center"));
                MM.util.setupBackButton();
            } else {
                // Record these results - they're still valid.
                MM.plugins.findprograms.last_found_programs = data;

                // Go and get the refreshed list of categories.
                // This goes back to find_categories_successful.
                MM.plugins.findprograms.list_categories();
            }
        },

        find_categories_successful: function(data) {
            // Store the categories in the app.
            // Categories are stored against the site id.
            _.each(data, function(category) {
                MM.db.insert('categories', category)
            });

            plugin.find_programs();
        },

        error: function(data) {
            console.log("Error");
            console.log(data);
        }
    }

    var plugin = {
        settings: {
            name: "findprograms",
            type: "general",
            title: "Find programs",
            icon: "img/icon/find-programs.png",
            lang: {
                component: "core"
            },
            menuURL: "#find_programs"
        },

        storage: {
            category: {type: "model"},
            categories: {type: "collection", model: "category"}
        },

        routes: [
            ["find_programs", "find_programs", "list_categories"],
        ],

        templates: {
            "results": {
                html: programsTpl
            }
        },

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.findprograms.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:$(document).innerWidth(),
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.mycourses.sizes = {
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


        last_found_programs: undefined,
        sizes: undefined,

        resize: function() {
            if (MM.plugins.findprograms.sizes == undefined) {
                MM.plugins.findprograms._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.findprograms.sizes.withSideBar.center,
                    'left':MM.plugins.findprograms.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.findprograms.sizes.withoutSideBar.center,
                    'left':MM.plugins.findprograms.sizes.withoutSideBar.left
                });
            }

            if (MM.deviceType === "phone") {
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

        list_categories: function() {
            MM.panels.showLoading('center');
            MM.assignCurrentPlugin(MM.plugins.findprograms);
            MM.moodleWSCall(
                'core_course_get_categories',
                {},
                callbacks.find_categories_successful,
                {},
                callbacks.error
            );
        },

        find_programs: function() {
            if (MM.plugins.findprograms.last_found_programs !== undefined) {
                callbacks.find_programs_successful(
                    MM.plugins.findprograms.last_found_programs
                );
                MM.plugins.findprograms.last_found_programs = undefined;
            } else {
                MM.moodleWSCall(
                    'totara_program_get_programs',
                    {},
                    callbacks.find_programs_successful,
                    {},
                    callbacks.error
                );
            }
        }
    };

    MM.registerPlugin(plugin);
});
