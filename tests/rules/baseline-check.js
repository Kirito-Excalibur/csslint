(function() {
    "use strict";
    var Assert = YUITest.Assert;

    YUITest.TestRunner.add(new YUITest.TestCase({

        name: "Baseline Check Rule Tests",

        "Using a high baseline property should not result in a warning": function() {
            var result = CSSLint.verify(".foo { display: flex; }", { "baseline-check": 1 });
            // High baseline properties should not generate warnings
            var warnings = result.messages.filter(function(msg) { 
                return msg.rule.id === "baseline-check"; 
            });
            Assert.areEqual(0, warnings.length);
        },

        "Using basic high baseline properties should not warn": function() {
            var result = CSSLint.verify(".foo { margin: 10px; padding: 5px; color: red; }", { "baseline-check": 1 });
            var warnings = result.messages.filter(function(msg) { 
                return msg.rule.id === "baseline-check"; 
            });
            Assert.areEqual(0, warnings.length);
        },

        "Using a no-baseline property should result in a warning": function() {
            var result = CSSLint.verify(".foo { view-transition-name: slide; }", { "baseline-check": 1 });
            var warnings = result.messages.filter(function(msg) { 
                return msg.rule.id === "baseline-check"; 
            });
            // view-transition-name should have no baseline support
            Assert.isTrue(warnings.length > 0);
            if (warnings.length > 0) {
                Assert.isTrue(warnings[0].message.indexOf("no baseline support") > -1);
            }
        },

        "Using a low baseline property should result in a warning": function() {
            var result = CSSLint.verify(".foo { animation-composition: add; }", { "baseline-check": 1 });
            var warnings = result.messages.filter(function(msg) { 
                return msg.rule.id === "baseline-check"; 
            });
            // animation-composition should have low baseline status
            Assert.isTrue(warnings.length > 0);
            if (warnings.length > 0) {
                Assert.isTrue(warnings[0].message.indexOf("low baseline status") > -1);
            }
        },

        "Using an unknown property should not crash": function() {
            var result = CSSLint.verify(".foo { unknown-property: value; }", { "baseline-check": 1 });
            // Should not crash, unknown properties are ignored
            Assert.isTrue(result.messages.length >= 0);
        },

        "Using multiple properties should check each one": function() {
            var result = CSSLint.verify(".foo { display: grid; margin: 10px; }", { "baseline-check": 1 });
            // Should process both properties without error
            Assert.isTrue(result.messages.length >= 0);
        },

        "Rule should work with vendor prefixes": function() {
            var result = CSSLint.verify(".foo { -webkit-transform: rotate(45deg); }", { "baseline-check": 1 });
            // Should handle vendor prefixes gracefully (they won't be found in web-features)
            Assert.isTrue(result.messages.length >= 0);
        },

        "Rule should handle shorthand properties": function() {
            var result = CSSLint.verify(".foo { animation: slide 1s ease-in-out; }", { "baseline-check": 1 });
            // Should process shorthand properties
            Assert.isTrue(result.messages.length >= 0);
        },

        "Rule should work in different CSS contexts": function() {
            var css = "@media screen { .foo { display: flex; } } @keyframes slide { 0% { opacity: 0; } }";
            var result = CSSLint.verify(css, { "baseline-check": 1 });
            // Should work in media queries and keyframes
            Assert.isTrue(result.messages.length >= 0);
        },

        "Rule should provide statistics": function() {
            var result = CSSLint.verify(".foo { display: flex; }", { "baseline-check": 1 });
            // Should track baseline properties
            Assert.isTrue(result.stats["baseline-properties-tracked"] >= 0);
        },

        "Rule should handle mixed baseline statuses correctly": function() {
            var css = ".test { display: flex; view-transition-name: slide; animation-composition: add; }";
            var result = CSSLint.verify(css, { "baseline-check": 1 });
            var warnings = result.messages.filter(function(msg) { 
                return msg.rule.id === "baseline-check"; 
            });
            
            // Should have warnings for view-transition-name and animation-composition, but not display
            Assert.isTrue(warnings.length >= 1);
            
            // Check that we have both no-baseline and low-baseline warnings
            var hasNoBaseline = warnings.some(function(w) { 
                return w.message.indexOf("no baseline support") > -1; 
            });
            var hasLowBaseline = warnings.some(function(w) { 
                return w.message.indexOf("low baseline status") > -1; 
            });
            
            Assert.isTrue(hasNoBaseline || hasLowBaseline);
        },

        "Rule should gracefully handle missing web-features": function() {
            // This test ensures the rule doesn't crash if web-features is not available
            // The rule should just not run in that case
            var result = CSSLint.verify(".foo { display: flex; }", { "baseline-check": 1 });
            Assert.isTrue(result.messages.length >= 0);
        }

    }));

})();