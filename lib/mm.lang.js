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
 * @fileoverview Moodle mobile lang lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */

/**
  * @namespace Holds all the MoodleMobile language functionality.
 */
MM.lang = {

    strings: [],
    current: '',

    determine: function() {
        // User preferences.
        var lang = MM.getConfig('lang');
        if (typeof(lang) != 'undefined') {
            return lang;
        }

        // Default site lang.
        if (typeof(MM.config.current_site) != 'undefined' && typeof(MM.config.current_site.lang) != 'undefined') {
            return MM.config.current_site.lang;
        }

        // Default language.
        return MM.config.default_lang;
    },

    setup: function(component) {
		MM.log('Strings: Lang setup for ' + component);
		var cacheEl = "";
        if (typeof(component) == 'undefined') {
            component = 'core';
			cacheEl = 'core';
        }

		if (component != 'core') {
			cacheEl = MM.plugins[component].settings.lang.component;
		}

        var lang = MM.lang.determine();

        // Try to find in cache the language strings.
        // Languages are automatically synchronised and stored in cache
        // forcing them to not expire.
        var langStrings = MM.cache.getElement('lang-' + cacheEl + '-' + lang, true);
        if (langStrings !== false && _.keys(langStrings).length > 0) {
            MM.lang.loadLang(component, lang, langStrings);
            MM.log('Strings loaded from cache (remote syte)', 'Strings');
        } else {
            // If the language hasn't been fully loaded in the cache then
            // load it here.
            MM.log('Attempting to load strings from file: /lang/' + lang + '.json');
            var extraLang = 'root/externallib/text!root/lang/' + lang + '.json';
            require([extraLang], function(extraLang) {
                MM.lang.loadLang(
                    'core', lang, JSON.parse(extraLang)
                );
            });
        }
    },

    loadLang: function(component, lang, strings) {
        MM.log('Strings: Loading lang ' + lang + ' for component ' + component);
        MM.lang.current = lang;
        if (typeof(MM.lang.strings[lang]) == 'undefined') {
            MM.lang.strings[lang] = [];
        }

        MM.lang.strings[lang][component] = strings;
        $(document).trigger('langLoaded');
    },

    loadPluginLang: function(component, strings) {
        MM.log('Strings: Loading plugin lang ' + component);
        if (!MM.lang.current) {
            MM.lang.current = 'en';
            MM.lang.strings['en'] = [];
        }

        // Try to find in cache the language strings.
        // Languages are automatically sync and stored in cache, forcing to not expire.
        var cacheStrings = MM.cache.getElement(
            'lang-' + component + '-' + MM.lang.current, true
        );
        if (cacheStrings) {
            strings = cacheStrings;
            MM.log('Strings: Plugin ' + component + ' Strings loaded from cache (remote system)');
        }

        MM.lang.strings[MM.lang.current][component] = strings;
        if (MM.lang.current != 'en') {
            MM.lang.strings['en'][component] = strings;
        }
    },

    pluginName: function(plugin) {
        if (MM.plugins[plugin].settings.lang.component != 'core') {
            return MM.lang.s('plugin' + plugin + 'name', plugin);
        }

        return MM.lang.s(plugin);
    },

    /**
     * Main function for translating strings
     *
     * @this {MM.lang}
     * @param {string} id The unique id of the string to be translated.
     * @param {string} component Core for regular strings or pluginname for plugins.
     */
    s: function(id, component, placeholders) {

        if (typeof(component) == 'undefined') {
            component = 'core';
        }

        if (typeof(placeholders) == 'undefined') {
            placeholders = {};
        }

        var translated = '';

        // If the string exists in the current language use that.
        if (typeof(MM.lang.strings[MM.lang.current]) != 'undefined' &&
            typeof(MM.lang.strings[MM.lang.current][component]) != 'undefined' &&
            typeof(MM.lang.strings[MM.lang.current][component][id]) !== 'undefined'
        ) {
            translated = MM.lang.strings[MM.lang.current][component][id];
        }

        // If the string doesn't exist in the current language, it might have
        // been a different component, and exist within the plugin settings
        // itself. So check there too.
        if (!translated && component != "core"
            && MM.plugins[component].settings.lang.strings
            && MM.plugins[component].settings.lang.strings[id] !== 'undefined') {
            translated = MM.plugins[component].settings.lang.strings[id];
        }

        // For missing strings, we use the [string] notation.
        if (!translated) {
            translated = '[[' + id + ']]';
        }

        // Replace placeholders
        translated = translated.replace(/{.+?}/g, function(x) {
            return placeholders[x.substring(1, x.length-1)];
        });

        return translated;
    },

    sync: function(forced) {
        MM.log('Executing lang sync function', 'Sync');
        var lang = MM.lang.determine();

        if (MM.deviceConnected() && MM.getConfig('sync_lang_on')) {
            var data = {
                'component': 'mobile',
                'lang': lang
            };

            MM.log('Loading lang file from remote site for core', 'Sync');
            MM.moodleWSCall('core_get_component_strings', data, function(strings) {
                var stringsFormatted = {};
                if (strings.length > 0) {
                    $.each(strings, function(index, string) {
                        stringsFormatted[string.stringid] = string.string;
                    });
                }
                MM.cache.addElement('lang-core-' + lang, stringsFormatted, 'lang');
                if (forced) {
                    MM.popMessage(MM.lang.s("langsynced"));
                }
            }, {silently: true, cache: false});

            for (var el in MM.plugins) {
                var plugin = MM.plugins[el];
                var component = plugin.settings.lang.component;
                if (component != 'core') {
                    var data = {
                        'component': component,
                        'lang': lang
                    };
                    MM.log('Sync: Loading lang from remtote site for component: ' + component);
                    MM.moodleWSCall('core_get_component_strings', data,
                        function(strings) {
                            var stringsFormatted = {};
                            if (strings.length > 0) {
                                $.each(strings, function(index, string) {
                                    stringsFormatted[string.stringid] = string.string;
                                });
                            }
                            MM.cache.addElement(
                                'lang-' + data.component + '-' + lang, stringsFormatted, 'lang'
                            );
                        },
                        {silently: true}
                    );
                }
            }
        }
    }
};
