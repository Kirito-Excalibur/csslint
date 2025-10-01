/*
 * Rule: Check CSS properties against web-features baseline status
 */

/* global require */

CSSLint.addRule({

    // rule information
    id: "baseline-check",
    name: "Baseline feature check",
    desc: "Check CSS properties against web-features baseline status.",
    url: "https://github.com/CSSLint/csslint/wiki/Baseline-feature-check",
    browsers: "All",

    // initialization
    init: function(parser, reporter) {
        "use strict";
        var rule = this,
            webFeatures,
            propertyToFeatures = {};

        // Try to load web-features, handle gracefully if not available
        try {
            webFeatures = require("web-features");
            
            // Build property to features mapping
            Object.keys(webFeatures.features).forEach(function(featureKey) {
                var feature = webFeatures.features[featureKey];
                if (feature.compat_features) { // jshint ignore:line
                    feature.compat_features.forEach(function(cf) { // jshint ignore:line
                        if (cf.indexOf("css.properties.") === 0) {
                            var propertyPath = cf.replace("css.properties.", "");
                            var propertyName = propertyPath.split(".")[0];
                            
                            if (!propertyToFeatures[propertyName]) {
                                propertyToFeatures[propertyName] = [];
                            }
                            
                            // Avoid duplicates
                            var exists = false;
                            for (var i = 0; i < propertyToFeatures[propertyName].length; i++) {
                                if (propertyToFeatures[propertyName][i].feature === featureKey) {
                                    exists = true;
                                    break;
                                }
                            }
                            
                            if (!exists) {
                                propertyToFeatures[propertyName].push({
                                    feature: featureKey,
                                    baseline: feature.status ? feature.status.baseline : false,
                                    name: feature.name,
                                    baselineDate: feature.status ? feature.status.baseline_low_date : null // jshint ignore:line
                                });
                            }
                        }
                    });
                }
            });
        } catch (ex) {
            // web-features not available, disable rule
            return;
        }

        function getBaselineStatus(propertyName) {
            var features = propertyToFeatures[propertyName];
            if (!features || features.length === 0) {
                return null;
            }
            
            // Check if there are any high baseline features for this property
            var highFeatures = features.filter(function(f) { return f.baseline === "high"; });
            var lowFeatures = features.filter(function(f) { return f.baseline === "low"; });
            var noBaselineFeatures = features.filter(function(f) { return f.baseline === false; });
            
            // If there are any high baseline features, the property is generally well-supported
            // Only warn about low/no-baseline features if there are no high baseline alternatives
            if (highFeatures.length > 0) {
                // Property has good baseline support, don't warn
                return {
                    status: "high",
                    features: highFeatures
                };
            } else if (lowFeatures.length > 0) {
                // Only low baseline support
                return {
                    status: "low",
                    features: lowFeatures
                };
            } else if (noBaselineFeatures.length > 0) {
                // No baseline support
                return {
                    status: "no-baseline",
                    features: noBaselineFeatures
                };
            }
            
            return null;
        }

        function formatFeatureInfo(features) {
            if (features.length === 1) {
                return features[0].name;
            } else {
                return features.map(function(f) { return f.name; }).join(", ");
            }
        }

        parser.addListener("property", function(event) {
            var propertyName = event.property.text.toLowerCase();
            var baselineInfo = getBaselineStatus(propertyName);
            
            if (baselineInfo) {
                var message;
                switch (baselineInfo.status) {
                    case "no-baseline":
                        message = "Property '" + propertyName + "' has no baseline support (" + 
                                formatFeatureInfo(baselineInfo.features) + "). Browser support is very limited.";
                        reporter.report(message, event.property.line, event.property.col, rule);
                        break;
                    case "low":
                        message = "Property '" + propertyName + "' has low baseline status (" + 
                                formatFeatureInfo(baselineInfo.features) + "). Consider providing fallbacks.";
                        reporter.report(message, event.property.line, event.property.col, rule);
                        break;
                    case "high":
                        // High baseline - no warning needed, but could be info
                        break;
                }
            }
        });

        // Report summary at the end
        parser.addListener("endstylesheet", function() {
            var totalProperties = Object.keys(propertyToFeatures).length;
            reporter.stat("baseline-properties-tracked", totalProperties);
        });
    }

});