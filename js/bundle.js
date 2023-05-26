var pickup = (function (exports) {
'use strict';

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var typestateNode = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
/*! typestate - v1.0.5 - 2017-11-28
* https://github.com/eonarheim/TypeState
* Copyright (c) 2017 Erik Onarheim; Licensed BSD-2-Clause*/
var typestate;
(function (typestate) {
    /**
     * Transition grouping to faciliate fluent api
     */
    var Transitions = (function () {
        function Transitions(fsm) {
            this.fsm = fsm;
        }
        /**
         * Specify the end state(s) of a transition function
         */
        Transitions.prototype.to = function () {
            var states = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                states[_i] = arguments[_i];
            }
            this.toStates = states;
            this.fsm.addTransitions(this);
        };
        /**
         * Specify that any state in the state enum is value
         * Takes the state enum as an argument
         */
        Transitions.prototype.toAny = function (states) {
            var toStates = [];
            for (var s in states) {
                if (states.hasOwnProperty(s)) {
                    toStates.push(states[s]);
                }
            }
            this.toStates = toStates;
            this.fsm.addTransitions(this);
        };
        return Transitions;
    }());
    typestate.Transitions = Transitions;
    /**
     * Internal representation of a transition function
     */
    var TransitionFunction = (function () {
        function TransitionFunction(fsm, from, to) {
            this.fsm = fsm;
            this.from = from;
            this.to = to;
        }
        return TransitionFunction;
    }());
    typestate.TransitionFunction = TransitionFunction;
    /**
     * A simple finite state machine implemented in TypeScript, the templated argument is meant to be used
     * with an enumeration.
     */
    var FiniteStateMachine = (function () {
        function FiniteStateMachine(startState, allowImplicitSelfTransition) {
            if (allowImplicitSelfTransition === void 0) { allowImplicitSelfTransition = false; }
            this._transitionFunctions = [];
            this._onCallbacks = {};
            this._exitCallbacks = {};
            this._enterCallbacks = {};
            this._invalidTransitionCallback = null;
            this.currentState = startState;
            this._startState = startState;
            this._allowImplicitSelfTransition = allowImplicitSelfTransition;
        }
        FiniteStateMachine.prototype.addTransitions = function (fcn) {
            var _this = this;
            fcn.fromStates.forEach(function (from) {
                fcn.toStates.forEach(function (to) {
                    // Only add the transition if the state machine is not currently able to transition.
                    if (!_this._canGo(from, to)) {
                        _this._transitionFunctions.push(new TransitionFunction(_this, from, to));
                    }
                });
            });
        };
        /**
         * Listen for the transition to this state and fire the associated callback
         */
        FiniteStateMachine.prototype.on = function (state, callback) {
            var key = state.toString();
            if (!this._onCallbacks[key]) {
                this._onCallbacks[key] = [];
            }
            this._onCallbacks[key].push(callback);
            return this;
        };
        /**
         * Listen for the transition to this state and fire the associated callback, returning
         * false in the callback will block the transition to this state.
         */
        FiniteStateMachine.prototype.onEnter = function (state, callback) {
            var key = state.toString();
            if (!this._enterCallbacks[key]) {
                this._enterCallbacks[key] = [];
            }
            this._enterCallbacks[key].push(callback);
            return this;
        };
        /**
         * Listen for the transition to this state and fire the associated callback, returning
         * false in the callback will block the transition from this state.
         */
        FiniteStateMachine.prototype.onExit = function (state, callback) {
            var key = state.toString();
            if (!this._exitCallbacks[key]) {
                this._exitCallbacks[key] = [];
            }
            this._exitCallbacks[key].push(callback);
            return this;
        };
        /**
         * List for an invalid transition and handle the error, returning a falsy value will throw an
         * exception, a truthy one will swallow the exception
         */
        FiniteStateMachine.prototype.onInvalidTransition = function (callback) {
            if (!this._invalidTransitionCallback) {
                this._invalidTransitionCallback = callback;
            }
            return this;
        };
        /**
         * Declares the start state(s) of a transition function, must be followed with a '.to(...endStates)'
         */
        FiniteStateMachine.prototype.from = function () {
            var states = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                states[_i] = arguments[_i];
            }
            var _transition = new Transitions(this);
            _transition.fromStates = states;
            return _transition;
        };
        FiniteStateMachine.prototype.fromAny = function (states) {
            var fromStates = [];
            for (var s in states) {
                if (states.hasOwnProperty(s)) {
                    fromStates.push(states[s]);
                }
            }
            var _transition = new Transitions(this);
            _transition.fromStates = fromStates;
            return _transition;
        };
        FiniteStateMachine.prototype._validTransition = function (from, to) {
            return this._transitionFunctions.some(function (tf) {
                return (tf.from === from && tf.to === to);
            });
        };
        /**
         * Check whether a transition between any two states is valid.
         *    If allowImplicitSelfTransition is true, always allow transitions from a state back to itself.
         *     Otherwise, check if it's a valid transition.
         */
        FiniteStateMachine.prototype._canGo = function (fromState, toState) {
            return (this._allowImplicitSelfTransition && fromState === toState) || this._validTransition(fromState, toState);
        };
        /**
         * Check whether a transition to a new state is valid
         */
        FiniteStateMachine.prototype.canGo = function (state) {
            return this._canGo(this.currentState, state);
        };
        /**
         * Transition to another valid state
         */
        FiniteStateMachine.prototype.go = function (state, event) {
            if (!this.canGo(state)) {
                if (!this._invalidTransitionCallback || !this._invalidTransitionCallback(this.currentState, state)) {
                    throw new Error('Error no transition function exists from state ' + this.currentState.toString() + ' to ' + state.toString());
                }
            }
            else {
                this._transitionTo(state, event);
            }
        };
        /**
         * This method is availble for overridding for the sake of extensibility.
         * It is called in the event of a successful transition.
         */
        FiniteStateMachine.prototype.onTransition = function (from, to) {
            // pass, does nothing until overidden
        };
        /**
        * Reset the finite state machine back to the start state, DO NOT USE THIS AS A SHORTCUT for a transition.
        * This is for starting the fsm from the beginning.
        */
        FiniteStateMachine.prototype.reset = function () {
            this.currentState = this._startState;
        };
        /**
         * Whether or not the current state equals the given state
         */
        FiniteStateMachine.prototype.is = function (state) {
            return this.currentState === state;
        };
        FiniteStateMachine.prototype._transitionTo = function (state, event) {
            var _this = this;
            if (!this._exitCallbacks[this.currentState.toString()]) {
                this._exitCallbacks[this.currentState.toString()] = [];
            }
            if (!this._enterCallbacks[state.toString()]) {
                this._enterCallbacks[state.toString()] = [];
            }
            if (!this._onCallbacks[state.toString()]) {
                this._onCallbacks[state.toString()] = [];
            }
            var canExit = this._exitCallbacks[this.currentState.toString()].reduce(function (accum, next) {
                return accum && next.call(_this, state);
            }, true);
            var canEnter = this._enterCallbacks[state.toString()].reduce(function (accum, next) {
                return accum && next.call(_this, _this.currentState, event);
            }, true);
            if (canExit && canEnter) {
                var old = this.currentState;
                this.currentState = state;
                this._onCallbacks[this.currentState.toString()].forEach(function (fcn) {
                    fcn.call(_this, old, event);
                });
                this.onTransition(old, state);
            }
        };
        return FiniteStateMachine;
    }());
    typestate.FiniteStateMachine = FiniteStateMachine;
})(typestate || (typestate = {}));
exports.typestate = typestate;
exports.TypeState = typestate;

});

unwrapExports(typestateNode);
var typestateNode_1 = typestateNode.typestate;
var typestateNode_2 = typestateNode.TypeState;

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var Vect = /** @class */ (function () {
    function Vect(x, y) {
        this.x = x;
        this.y = y;
    }
    return Vect;
}());
function v(x, y) {
    return new Vect(x, y);
}
var vzero = new Vect(0, 0);
/// Vector dot product.
function vdot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}
function vdot2(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
}
/// Returns the length of v.
function vlength(vect) {
    return Math.sqrt(vdot(vect, vect));
}
function vlength2(x, y) {
    return Math.sqrt(x * x + y * y);
}
/// Add two vectors
function vadd() {
    var vectors = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        vectors[_i] = arguments[_i];
    }
    var x = 0;
    var y = 0;
    for (var _a = 0, vectors_1 = vectors; _a < vectors_1.length; _a++) {
        var vector = vectors_1[_a];
        x += vector.x;
        y += vector.y;
    }
    return new Vect(x, y);
}
/// Subtract two vectors.
function vsub(v1, v2) {
    return new Vect(v1.x - v2.x, v1.y - v2.y);
}
/// Negate a vector.
function vneg(vect) {
    return new Vect(-vect.x, -vect.y);
}
/// Scalar multiplication.
function vmult(vect, s) {
    return new Vect(vect.x * s, vect.y * s);
}
/// 2D vector cross product analog.
/// The cross product of 2D vectors results in a 3D vector with only a z
/// component.  This function returns the magnitude of the z value..
function vcross(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
}
function vcross2(x1, y1, x2, y2) {
    return x1 * y2 - y1 * x2;
}
/// Returns a perpendicular vector. (90 degree rotation)
function vperp(vect) {
    return new Vect(-vect.y, vect.x);
}
/// Returns the vector projection of v1 onto v2.
function vproject(v1, v2) {
    return vmult(v2, vdot(v1, v2) / vlengthsq(v2));
}
/// Uses complex number multiplication to rotate v1 by v2. Scaling will occur
/// if v1 is not a unit vector.
function vrotate(v1, v2) {
    return new Vect(v1.x * v2.x - v1.y * v2.y, v1.x * v2.y + v1.y * v2.x);
}
/// Inverse of vrotate().
function vunrotate(v1, v2) {
    return new Vect(v1.x * v2.x + v1.y * v2.y, v1.y * v2.x - v1.x * v2.y);
}
/// Returns the squared length of v. Faster than vlength() when you only need to
/// compare lengths.
function vlengthsq(vect) {
    return vdot(vect, vect);
}
function vlengthsq2(x, y) {
    return x * x + y * y;
}
/// Linearly interpolate between v1 and v2.
function vlerp(v1, v2, t) {
    return vadd(vmult(v1, 1 - t), vmult(v2, t));
}
/// Returns a normalized copy of v.
function vnormalize(vect) {
    return vmult(vect, 1 / vlength(vect));
}
/// Returns a normalized copy of v or vzero if v was already vzero. Protects
/// against divide by zero errors.
function vnormalize_safe(vect) {
    return (vect.x === 0 && vect.y === 0 ? vzero : vnormalize(vect));
}
/// Clamp v to length len.
function vclamp(vect, len) {
    return (vdot(vect, vect) > len * len) ? vmult(vnormalize(vect), len) : vect;
}
/// Returns the distance between v1 and v2.
function vdist(v1, v2) {
    return vlength(vsub(v1, v2));
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
function assert(value, message) {
    if (!value) {
        throw new Error("Assertion failed: " + message);
    }
}
function assertSoft(value, message) {
    if (!value && console && console.warn) {
        // tslint:disable-next-line
        console.warn("ASSERTION FAILED: " + message);
        if (console.trace) {
            // tslint:disable-next-line
            console.trace();
        }
    }
}
/* The hashpair function takes two numbers and returns a hash code for them.
 * Required that hashPair(a, b) === hashPair(b, a).
 * The result of hashPair is used as the key in objects, so it returns a string.
 */
function hashPair(a, b) {
    return a < b ? a + " " + b : b + " " + a;
}
function deleteObjFromList(arr, obj) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === obj) {
            arr[i] = arr[arr.length - 1];
            arr.length--;
            return;
        }
    }
}
function closestPointOnSegment(p, a, b) {
    var delta = vsub(a, b);
    var t = clamp01(vdot(delta, vsub(p, b)) / vlengthsq(delta));
    return vadd(b, vmult(delta, t));
}
function closestPointOnSegment2(px, py, ax, ay, bx, by) {
    var deltax = ax - bx;
    var deltay = ay - by;
    var t = clamp01(vdot2(deltax, deltay, px - bx, py - by) /
        vlengthsq2(deltax, deltay));
    return new Vect(bx + deltax * t, by + deltay * t);
}
function momentForCircle(m, r1, r2, offset) {
    return m * (0.5 * (r1 * r1 + r2 * r2) + vlengthsq(offset));
}
function momentForBox(m, width, height) {
    return m * (width * width + height * height) / 12;
}
/// Clamp @c f to be between @c min and @c max.
function clamp(f, minv, maxv) {
    return Math.min(Math.max(f, minv), maxv);
}
/// Clamp @c f to be between 0 and 1.
function clamp01(f) {
    return Math.max(0, Math.min(f, 1));
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// a and b are bodies.
function relativeVelocity(a, b, r1, r2) {
    // var v1_sum = vadd(a.v, vmult(vperp(r1), a.w));
    var v1sumx = a.v.x + (-r1.y) * a.w;
    var v1sumy = a.v.y + (r1.x) * a.w;
    // var v2_sum = vadd(b.v, vmult(vperp(r2), b.w));
    var v2sumx = b.v.x + (-r2.y) * b.w;
    var v2sumy = b.v.y + (r2.x) * b.w;
    // return vsub(v2_sum, v1_sum);
    return new Vect(v2sumx - v1sumx, v2sumy - v1sumy);
}
function normalRelativeVelocity(a, b, r1, r2, n) {
    // return vdot(relative_velocity(a, b, r1, r2), n);
    var v1sumx = a.v.x + (-r1.y) * a.w;
    var v1sumy = a.v.y + (r1.x) * a.w;
    var v2sumx = b.v.x + (-r2.y) * b.w;
    var v2sumy = b.v.y + (r2.x) * b.w;
    return vdot2(v2sumx - v1sumx, v2sumy - v1sumy, n.x, n.y);
}
function applyImpulse(body, jx, jy, r) {
    body.v = vadd(body.v, vmult(new Vect(jx, jy), body.massInv));
    body.w += body.inertiaInv * (r.x * jy - r.y * jx);
}
function applyImpulses(a, b, r1, r2, jx, jy) {
    applyImpulse(a, -jx, -jy, r1);
    applyImpulse(b, jx, jy, r2);
}
function applyBiasImpulse(body, jx, jy, r) {
    body.vBias = vadd(body.vBias, vmult(new Vect(jx, jy), body.massInv));
    body.wBias += body.inertiaInv * vcross2(r.x, r.y, jx, jy);
}
function kScalarBody(body, r, n) {
    var rcn = vcross(r, n);
    return body.massInv + body.inertiaInv * rcn * rcn;
}
function kScalar(a, b, r1, r2, n) {
    var value = kScalarBody(a, r1, n) + kScalarBody(b, r2, n);
    assertSoft(value !== 0, "Unsolvable collision or constraint.");
    return value;
}
// k1 and k2 are modified by the function to contain the outputs.
function kTensor(a, b, r1, r2) {
    var k11;
    var k12;
    var k21;
    var k22;
    var msum = a.massInv + b.massInv;
    // start with I*m_sum
    k11 = msum;
    k12 = 0;
    k21 = 0;
    k22 = msum;
    // add the influence from r1
    var r1xsq = r1.x * r1.x * a.inertiaInv;
    var r1ysq = r1.y * r1.y * a.inertiaInv;
    var r1nxy = -r1.x * r1.y * a.inertiaInv;
    k11 += r1ysq;
    k12 += r1nxy;
    k21 += r1nxy;
    k22 += r1xsq;
    // add the influnce from r2
    var r2xsq = r2.x * r2.x * b.inertiaInv;
    var r2ysq = r2.y * r2.y * b.inertiaInv;
    var r2nxy = -r2.x * r2.y * b.inertiaInv;
    k11 += r2ysq;
    k12 += r2nxy;
    k21 += r2nxy;
    k22 += r2xsq;
    // invert
    var determinant = k11 * k22 - k12 * k21;
    assertSoft(determinant !== 0, "Unsolvable constraint.");
    var determinantInv = 1 / determinant;
    return [
        new Vect(k22 * determinantInv, -k12 * determinantInv),
        new Vect(-k21 * determinantInv, k11 * determinantInv),
    ];
}
function multK(vr, k1, k2) {
    return new Vect(vdot(vr, k1), vdot(vr, k2));
}
function biasCoef(errorBias, dt) {
    return 1 - Math.pow(errorBias, dt);
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/// A struct that wraps up the important collision data for an arbiter.
var ContactPoint = /** @class */ (function () {
    function ContactPoint(point, normal, dist) {
        this.point = point;
        this.normal = normal;
        this.dist = dist;
    }
    return ContactPoint;
}());
// **** Collision Handlers
//
// Collision handlers are user-defined objects to describe the behaviour of
// colliding objects.
var CollisionHandler = /** @class */ (function () {
    function CollisionHandler() {
        // The collision type
        this.a = this.b = 0;
    }
    /// Collision begin event callback
    /// Returning false from a begin callback causes the collision to be ignored
    /// until the the separate callback is called when the objects stop
    /// colliding.
    CollisionHandler.prototype.begin = function (arb, space) {
        return true;
    };
    /// Collision pre-solve event callback
    /// Returning false from a pre-step callback causes the collision to be
    /// ignored until the next step.
    CollisionHandler.prototype.preSolve = function (arb, space) {
        return true;
    };
    /// Collision post-solve event function callback type.
    CollisionHandler.prototype.postSolve = function (arb, space) {
        // Pass.
    };
    /// Collision separate event function callback type.
    CollisionHandler.prototype.separate = function (arb, space) {
        // Pass.
    };
    return CollisionHandler;
}());
/// A colliding pair of shapes.
var Arbiter = /** @class */ (function () {
    function Arbiter(a, b) {
        /// Calculated value to use for the elasticity coefficient.
        /// Override in a pre-solve collision handler for custom behavior.
        this.e = 0;
        /// Calculated value to use for the friction coefficient.
        /// Override in a pre-solve collision handler for custom behavior.
        this.u = 0;
        /// Calculated value to use for applying surface velocities.
        /// Override in a pre-solve collision handler for custom behavior.
        this.vrSurface = vzero;
        this.threadNextA = null;
        this.threadPrevA = null;
        this.threadNextB = null;
        this.threadPrevB = null;
        this.shapeA = a;
        this.bodyA = a.body;
        this.shapeB = b;
        this.bodyB = b.body;
        this.contacts = null;
        this.stamp = 0;
        this.handler = null;
        this.swappedColl = false;
        this.state = "first-coll";
    }
    Arbiter.prototype.getShapes = function () {
        if (this.swappedColl) {
            return [this.shapeB, this.shapeA];
        }
        else {
            return [this.shapeA, this.shapeB];
        }
    };
    /// Calculate the total impulse that was applied by this arbiter.
    /// This function should only be called from a post-solve, post-step or
    /// cpBodyEachArbiter callback.
    Arbiter.prototype.totalImpulse = function () {
        var contacts = this.contacts;
        var sum = new Vect(0, 0);
        for (var i = 0, count = contacts.length; i < count; i++) {
            var con = contacts[i];
            sum = vadd(sum, vmult(con.n, con.jnAcc));
        }
        return this.swappedColl ? sum : vneg(sum);
    };
    /// Calculate the total impulse including the friction that was applied by
    /// this arbiter.
    /// This function should only be called from a post-solve, post-step or
    /// cpBodyEachArbiter callback.
    Arbiter.prototype.totalImpulseWithFriction = function () {
        var contacts = this.contacts;
        var sum = new Vect(0, 0);
        for (var i = 0, count = contacts.length; i < count; i++) {
            var con = contacts[i];
            sum = vrotate(vadd(sum, new Vect(con.jnAcc, con.jtAcc)), con.n);
        }
        return this.swappedColl ? sum : vneg(sum);
    };
    /// Calculate the amount of energy lost in a collision including static,
    /// but not dynamic friction.
    /// This function should only be called from a post-solve, post-step or
    /// cpBodyEachArbiter callback.
    Arbiter.prototype.totalKE = function () {
        var eCoef = (1 - this.e) / (1 + this.e);
        var sum = 0;
        var contacts = this.contacts;
        for (var i = 0, count = contacts.length; i < count; i++) {
            var con = contacts[i];
            var jnAcc = con.jnAcc;
            var jtAcc = con.jtAcc;
            sum += (eCoef * jnAcc * jnAcc / con.nMass +
                jtAcc * jtAcc / con.tMass);
        }
        return sum;
    };
    /// Causes a collision pair to be ignored as if you returned false from a
    /// begin callback.
    /// If called from a pre-step callback, you will still need to return false
    /// if you want it to be ignored in the current step.
    Arbiter.prototype.ignore = function () {
        this.state = "ignore";
    };
    /// Return the colliding shapes involved for this arbiter.
    /// The order of their cpSpace.collision_type values will match
    /// the order set when the collision handler was registered.
    Arbiter.prototype.getA = function () {
        return this.swappedColl ? this.shapeB : this.shapeA;
    };
    Arbiter.prototype.getB = function () {
        return this.swappedColl ? this.shapeA : this.shapeB;
    };
    /// Returns true if this is the first step a pair of objects started
    /// colliding.
    Arbiter.prototype.isFirstContact = function () {
        return this.state === "first-coll";
    };
    /// Return a contact set from an arbiter.
    Arbiter.prototype.getContactPointSet = function () {
        var set = new Array(this.contacts.length);
        var i;
        for (i = 0; i < set.length; i++) {
            set[i] = new ContactPoint(this.contacts[i].p, this.contacts[i].n, this.contacts[i].dist);
        }
        return set;
    };
    /// Get the normal of the @c ith contact point.
    Arbiter.prototype.getNormal = function (i) {
        var n = this.contacts[i].n;
        return this.swappedColl ? vneg(n) : n;
    };
    /// Get the position of the @c ith contact point.
    Arbiter.prototype.getPoint = function (i) {
        return this.contacts[i].p;
    };
    /// Get the depth of the @c ith contact point.
    Arbiter.prototype.getDepth = function (i) {
        return this.contacts[i].dist;
    };
    Arbiter.prototype.unthread = function () {
        unthreadHelper(this, this.bodyA, this.threadPrevA, this.threadNextA);
        unthreadHelper(this, this.bodyB, this.threadPrevB, this.threadNextB);
        this.threadPrevA = this.threadNextA = null;
        this.threadPrevB = this.threadNextB = null;
    };
    Arbiter.prototype.update = function (contacts, handler, a, b) {
        // Arbiters without contact data may exist if a collision function
        // rejected the collision.
        if (this.contacts) {
            // Iterate over the possible pairs to look for hash value matches.
            for (var _i = 0, _a = this.contacts; _i < _a.length; _i++) {
                var old = _a[_i];
                for (var _b = 0, contacts_1 = contacts; _b < contacts_1.length; _b++) {
                    var newContact = contacts_1[_b];
                    // This could trigger false positives, but is fairly
                    //  unlikely nor serious if it does.
                    if (newContact.hash === old.hash) {
                        // Copy the persistant contact information.
                        newContact.jnAcc = old.jnAcc;
                        newContact.jtAcc = old.jtAcc;
                    }
                }
            }
        }
        this.contacts = contacts;
        this.handler = handler;
        this.swappedColl = (a.collisionType !== handler.a);
        this.e = a.restitutionCoef * b.restitutionCoef;
        this.u = a.frictionCoef * b.frictionCoef;
        this.vrSurface = vsub(a.surfaceVelocity, b.surfaceVelocity);
        // For collisions between two similar primitive types, the order could
        // have been swapped.
        this.shapeA = a;
        this.bodyA = a.body;
        this.shapeB = b;
        this.bodyB = b.body;
        // mark it as new if it's been cached
        if (this.state === "cached") {
            this.state = "first-coll";
        }
    };
    Arbiter.prototype.preStep = function (dt, slop, bias) {
        var a = this.bodyA;
        var b = this.bodyB;
        for (var _i = 0, _a = this.contacts; _i < _a.length; _i++) {
            var con = _a[_i];
            // Calculate the offsets.
            con.r1 = vsub(con.p, a.p);
            con.r2 = vsub(con.p, b.p);
            // Calculate the mass normal and mass tangent.
            con.nMass = 1 / kScalar(a, b, con.r1, con.r2, con.n);
            con.tMass = 1 / kScalar(a, b, con.r1, con.r2, vperp(con.n));
            // Calculate the target bias velocity.
            con.bias = -bias * Math.min(0, con.dist + slop) / dt;
            con.jBias = 0;
            // Calculate the target bounce velocity.
            con.bounce = normalRelativeVelocity(a, b, con.r1, con.r2, con.n) * this.e;
        }
    };
    Arbiter.prototype.applyCachedImpulse = function (dtCoef) {
        if (this.isFirstContact()) {
            return;
        }
        var a = this.bodyA;
        var b = this.bodyB;
        for (var _i = 0, _a = this.contacts; _i < _a.length; _i++) {
            var con = _a[_i];
            // var j = vrotate(con.n, new Vect(con.jnAcc, con.jtAcc));
            var nx = con.n.x;
            var ny = con.n.y;
            var jx = nx * con.jnAcc - ny * con.jtAcc;
            var jy = nx * con.jtAcc + ny * con.jnAcc;
            // apply_impulses(a, b, con.r1, con.r2, vmult(j, dt_coef));
            applyImpulses(a, b, con.r1, con.r2, jx * dtCoef, jy * dtCoef);
        }
    };
    Arbiter.prototype.applyImpulse = function () {
        // if (!this.contacts) { throw new Error('contacts is undefined'); }
        var a = this.bodyA;
        var b = this.bodyB;
        var vrSurface = this.vrSurface;
        var friction = this.u;
        this.contacts.forEach(function (con, i) {
            var nMass = con.nMass;
            var n = con.n;
            var r1 = con.r1;
            var r2 = con.r2;
            // var vr = relative_velocity(a, b, r1, r2);
            var vrx = b.v.x - r2.y * b.w - (a.v.x - r1.y * a.w);
            var vry = b.v.y + r2.x * b.w - (a.v.y + r1.x * a.w);
            // var vb1 = vadd(vmult(vperp(r1), a.w_bias), a.v_bias);
            // var vb2 = vadd(vmult(vperp(r2), b.w_bias), b.v_bias);
            // var vbn = vdot(vsub(vb2, vb1), n);
            var vbn = (n.x * (b.vBias.x - r2.y * b.wBias -
                a.vBias.x + r1.y * a.wBias) +
                n.y * (r2.x * b.wBias + b.vBias.y -
                    r1.x * a.wBias - a.vBias.y));
            var vrn = vdot2(vrx, vry, n.x, n.y);
            // var vrt = vdot(vadd(vr, surface_vr), vperp(n));
            var vrt = vdot2(vrx + vrSurface.x, vry + vrSurface.y, -n.y, n.x);
            var jbn = (con.bias - vbn) * nMass;
            var jbnOld = con.jBias;
            con.jBias = Math.max(jbnOld + jbn, 0);
            var jn = -(con.bounce + vrn) * nMass;
            var jnOld = con.jnAcc;
            con.jnAcc = Math.max(jnOld + jn, 0);
            var jtMax = friction * con.jnAcc;
            var jt = -vrt * con.tMass;
            var jtOld = con.jtAcc;
            con.jtAcc = clamp(jtOld + jt, -jtMax, jtMax);
            // apply_bias_impulses(a, b, r1, r2, vmult(n, con.jBias - jbnOld));
            var xBias = n.x * (con.jBias - jbnOld);
            var yBias = n.y * (con.jBias - jbnOld);
            applyBiasImpulse(a, -xBias, -yBias, r1);
            applyBiasImpulse(b, xBias, yBias, r2);
            // apply_impulses(
            //     a, b, r1, r2,
            //     vrotate(n, new Vect(con.jnAcc - jnOld, con.jtAcc - jtOld)),
            // );
            var rotX = con.jnAcc - jnOld;
            var rotY = con.jtAcc - jtOld;
            // Inlining apply_impulses decreases speed for some reason :/
            applyImpulses(a, b, r1, r2, n.x * rotX - n.y * rotY, n.x * rotY + n.y * rotX);
        });
    };
    Arbiter.prototype.callSeparate = function (space) {
        // The handler needs to be looked up again as the handler cached on the
        // arbiter may have been deleted since the last step.
        var handler = space.lookupHandler(this.shapeA.collisionType, this.shapeB.collisionType);
        handler.separate(this, space);
    };
    // From chipmunk_private.h
    Arbiter.prototype.next = function (body) {
        return (this.bodyA === body ? this.threadNextA : this.threadNextB);
    };
    return Arbiter;
}());
/*
Arbiter.prototype.threadForBody = function(body)
{
    return (this.body_a === body ? this.thread_a : this.thread_b);
};*/
function unthreadHelper(arb, body, prev, next) {
    // thread_x_y is quite ugly, but it avoids making unnecessary js objects per
    // arbiter.
    if (prev) {
        // cpArbiterThreadForBody(prev, body)->next = next;
        if (prev.bodyA === body) {
            prev.threadNextA = next;
        }
        else {
            prev.threadNextB = next;
        }
    }
    else if (body.arbiterList === arb) {
        body.arbiterList = next;
    }
    if (next) {
        // cpArbiterThreadForBody(next, body)->prev = prev;
        if (next.bodyA === body) {
            next.threadPrevA = prev;
        }
        else {
            next.threadPrevB = prev;
        }
    }
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// Bounding boxes are JS objects with {l, b, r, t} = left, bottom, right, top,
// respectively.
var BB = /** @class */ (function () {
    function BB(l, b, r, t) {
        this.l = l;
        this.b = b;
        this.r = r;
        this.t = t;
    }
    BB.prototype.containsVect = function (vect) {
        return (this.l <= vect.x &&
            this.r >= vect.x &&
            this.b <= vect.y &&
            this.t >= vect.y);
    };
    BB.prototype.containsBox = function (other) {
        return (this.l <= other.l &&
            this.r >= other.r &&
            this.b <= other.b &&
            this.t >= other.t);
    };
    /// Returns a bounding box that holds both @c bb and @c v.
    BB.prototype.expand = function (vect) {
        return new BB(Math.min(this.l, vect.x), Math.min(this.b, vect.y), Math.max(this.r, vect.x), Math.max(this.t, vect.y));
    };
    return BB;
}());
function bbNewForCircle(c, r) {
    return new BB(c.x - r, c.y - r, c.x + r, c.y + r);
}
function bbIntersects2(box, l, b, r, t) {
    return (box.l <= r && l <= box.r && box.b <= t && b <= box.t);
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var SpatialIndex = /** @class */ (function () {
    function SpatialIndex() {
        // The number of objects in the spatial index.
        this.count = 0;
    }
    // Reindex a single object in the spatial index.
    SpatialIndex.prototype.reindexShape = function (shape) {
        // Pass.
    };
    // Perform a re-index of all active shapes in the spatial index.
    SpatialIndex.prototype.reindex = function () {
        // Pass.
    };
    // Perform a full re-index of all static and active shapes in the spatial
    // index.
    SpatialIndex.prototype.reindexStatic = function () {
        // Pass.
    };
    return SpatialIndex;
}());

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var Branch = /** @class */ (function () {
    function Branch(a, b) {
        this.bbL = Math.min(a.bbL, b.bbL);
        this.bbB = Math.min(a.bbB, b.bbB);
        this.bbR = Math.max(a.bbR, b.bbR);
        this.bbT = Math.max(a.bbT, b.bbT);
        this.parent = null;
        this.setA(a);
        this.setB(b);
    }
    Branch.prototype.setA = function (value) {
        this.childA = value;
        value.parent = this;
    };
    Branch.prototype.setB = function (value) {
        this.childB = value;
        value.parent = this;
    };
    Branch.prototype.otherChild = function (child) {
        return (this.childA === child ? this.childB : this.childA);
    };
    Branch.prototype.replaceChild = function (child, value) {
        assertSoft(child === this.childA || child === this.childB, "Node is not a child of parent.");
        if (this.childA === child) {
            this.setA(value);
        }
        else {
            this.setB(value);
        }
        for (var branch = this; branch; branch = branch.parent) {
            // node.bb = bbMerge(node.A.bb, node.B.bb);
            var a = branch.childA;
            var b = branch.childB;
            branch.bbL = Math.min(a.bbL, b.bbL);
            branch.bbB = Math.min(a.bbB, b.bbB);
            branch.bbR = Math.max(a.bbR, b.bbR);
            branch.bbT = Math.max(a.bbT, b.bbT);
        }
    };
    Branch.prototype.insert = function (leaf) {
        var costA = this.childB.bbArea() + bbTreeMergedArea(this.childA, leaf);
        var costB = this.childA.bbArea() + bbTreeMergedArea(this.childB, leaf);
        if (costA === costB) {
            costA = bbProximity(this.childA, leaf);
            costB = bbProximity(this.childB, leaf);
        }
        if (costB < costA) {
            this.setB(this.childB.insert(leaf));
        }
        else {
            this.setA(this.childA.insert(leaf));
        }
        this.bbL = Math.min(this.bbL, leaf.bbL);
        this.bbB = Math.min(this.bbB, leaf.bbB);
        this.bbR = Math.max(this.bbR, leaf.bbR);
        this.bbT = Math.max(this.bbT, leaf.bbT);
        return this;
    };
    Branch.prototype.markIfTouching = function (leaf, tree) {
        if (bbTreeIntersectsNode(leaf, this)) {
            this.childA.markIfTouching(leaf, tree);
            this.childB.markIfTouching(leaf, tree);
        }
    };
    Branch.prototype.intersectsBB = function (bb$$1) {
        return (this.bbL <= bb$$1.r &&
            bb$$1.l <= this.bbR &&
            this.bbB <= bb$$1.t &&
            bb$$1.b <= this.bbT);
    };
    Branch.prototype.bbArea = function () {
        return (this.bbR - this.bbL) * (this.bbT - this.bbB);
    };
    Branch.prototype.query = function (bb$$1, func) {
        // if(bbIntersectsBB(subtree.bb, bb)){
        if (this.intersectsBB(bb$$1)) {
            this.childA.query(bb$$1, func);
            this.childB.query(bb$$1, func);
        }
    };
    /// Returns the fraction along the segment query the node hits. Returns
    /// Infinity if it doesn't hit.
    Branch.prototype.childSegmentQuery = function (child, a, b) {
        var idx = 1 / (b.x - a.x);
        var txA = (child.bbL === a.x ? -Infinity : (child.bbL - a.x) * idx);
        var txB = (child.bbR === a.x ? Infinity : (child.bbR - a.x) * idx);
        var txMin = Math.min(txA, txB);
        var txMax = Math.max(txA, txB);
        var idy = 1 / (b.y - a.y);
        var tyA = (child.bbB === a.y ? -Infinity : (child.bbB - a.y) * idy);
        var tyB = (child.bbT === a.y ? Infinity : (child.bbT - a.y) * idy);
        var tyMin = Math.min(tyA, tyB);
        var tyMax = Math.max(tyA, tyB);
        if (tyMin <= txMax && txMin <= tyMax) {
            var tMin = Math.max(txMin, tyMin);
            var tMax = Math.min(txMax, tyMax);
            if (0.0 <= tMax && tMin <= 1.0) {
                return Math.max(tMin, 0.0);
            }
        }
        return Infinity;
    };
    Branch.prototype.segmentQuery = function (a, b, tExit, func) {
        var tA = this.childSegmentQuery(this.childA, a, b);
        var tB = this.childSegmentQuery(this.childB, a, b);
        if (tA < tB) {
            if (tA < tExit) {
                tExit = Math.min(tExit, this.childA.segmentQuery(a, b, tExit, func));
            }
            if (tB < tExit) {
                tExit = Math.min(tExit, this.childB.segmentQuery(a, b, tExit, func));
            }
        }
        else {
            if (tB < tExit) {
                tExit = Math.min(tExit, this.childB.segmentQuery(a, b, tExit, func));
            }
            if (tA < tExit) {
                tExit = Math.min(tExit, this.childA.segmentQuery(a, b, tExit, func));
            }
        }
        return tExit;
    };
    return Branch;
}());
var Leaf = /** @class */ (function () {
    function Leaf(tree, shape) {
        this.shape = shape;
        tree.getBB(shape, this);
        this.parent = null;
        this.stamp = 1;
        this.touching = new Set();
    }
    Leaf.prototype.insert = function (leaf) {
        return new Branch(leaf, this);
    };
    Leaf.prototype.clearPairs = function (tree) {
        var _this = this;
        this.touching.forEach(function (other) {
            other.touching.delete(_this);
        });
        this.touching.clear();
    };
    Leaf.prototype.markIfTouching = function (leaf, tree) {
        if (leaf === this) {
            return;
        }
        if (bbTreeIntersectsNode(leaf, this)) {
            this.touching.add(leaf);
            leaf.touching.add(this);
        }
    };
    Leaf.prototype.markTouching = function (tree) {
        if (this.stamp === tree.getStamp()) {
            // Shape has been changed in the most recent step.  Rebuild the
            // list of neighbours.
            tree.root.markIfTouching(this, tree);
        }
    };
    // **** Leaf Functions
    Leaf.prototype.containsShape = function (shape) {
        return (this.bbL <= shape.bbL &&
            this.bbR >= shape.bbR &&
            this.bbB <= shape.bbB &&
            this.bbT >= shape.bbT);
    };
    Leaf.prototype.update = function (tree) {
        var root = tree.root;
        var shape = this.shape;
        // if(!bbContainsBB(this.bb, bb)){
        if (!this.containsShape(shape)) {
            tree.getBB(this.shape, this);
            root = subtreeRemove(root, this, tree);
            if (tree.root) {
                tree.root = tree.root.insert(this);
            }
            else {
                tree.root = this;
            }
            this.clearPairs(tree);
            this.stamp = tree.getStamp();
            return true;
        }
        return false;
    };
    Leaf.prototype.addPairs = function (tree) {
        if (tree.root) {
            tree.root.markIfTouching(this, tree);
        }
    };
    Leaf.prototype.intersectsBB = function (bb$$1) {
        return (this.bbL <= bb$$1.r &&
            bb$$1.l <= this.bbR &&
            this.bbB <= bb$$1.t &&
            bb$$1.b <= this.bbT);
    };
    Leaf.prototype.bbArea = function () {
        return (this.bbR - this.bbL) * (this.bbT - this.bbB);
    };
    Leaf.prototype.query = function (bb$$1, func) {
        if (this.intersectsBB(bb$$1)) {
            func(this.shape);
        }
    };
    Leaf.prototype.segmentQuery = function (a, b, tExit, func) {
        return func(this.shape);
    };
    return Leaf;
}());
function bbTreeMergedArea(a, b) {
    return ((Math.max(a.bbR, b.bbR) - Math.min(a.bbL, b.bbL)) *
        (Math.max(a.bbT, b.bbT) - Math.min(a.bbB, b.bbB)));
}
function bbProximity(a, b) {
    return (Math.abs(a.bbL + a.bbR - b.bbL - b.bbR) +
        Math.abs(a.bbB + a.bbT - b.bbB - b.bbT));
}
function subtreeRemove(subtree, leaf, tree) {
    if (leaf === subtree) {
        return null;
    }
    else {
        if (leaf.parent === subtree) {
            var other = leaf.parent.otherChild(leaf);
            other.parent = subtree.parent;
            return other;
        }
        else {
            leaf.parent.parent.replaceChild(leaf.parent, leaf.parent.otherChild(leaf));
            return subtree;
        }
    }
}
function bbTreeIntersectsNode(a, b) {
    return (a.bbL <= b.bbR &&
        b.bbL <= a.bbR &&
        a.bbB <= b.bbT &&
        b.bbB <= a.bbT);
}
var BBTree = /** @class */ (function () {
    function BBTree() {
        this.velocityFunc = null;
        this.leaves = new Map();
        this.stamp = 0;
        this.root = null;
    }
    BBTree.prototype.getStamp = function () {
        return this.stamp;
    };
    BBTree.prototype.incrementStamp = function () {
        this.stamp++;
    };
    // TODO move to leaf
    BBTree.prototype.getBB = function (shape, dest) {
        var velocityFunc = this.velocityFunc;
        if (velocityFunc) {
            var coef = 0.1;
            var x = (shape.bbR - shape.bbL) * coef;
            var y = (shape.bbT - shape.bbB) * coef;
            var v$$1 = vmult(velocityFunc(shape), 0.1);
            dest.bbL = shape.bbL + Math.min(-x, v$$1.x);
            dest.bbB = shape.bbB + Math.min(-y, v$$1.y);
            dest.bbR = shape.bbR + Math.max(x, v$$1.x);
            dest.bbT = shape.bbT + Math.max(y, v$$1.y);
        }
        else {
            dest.bbL = shape.bbL;
            dest.bbB = shape.bbB;
            dest.bbR = shape.bbR;
            dest.bbT = shape.bbT;
        }
    };
    // **** Insert/Remove
    BBTree.prototype.insert = function (shape) {
        var leaf = new Leaf(this, shape);
        this.leaves.set(shape, leaf);
        if (this.root) {
            this.root = this.root.insert(leaf);
        }
        else {
            this.root = leaf;
        }
        leaf.stamp = this.getStamp();
        leaf.addPairs(this);
        this.incrementStamp();
    };
    BBTree.prototype.remove = function (shape) {
        var leaf = this.leaves.get(shape);
        this.leaves.delete(shape);
        this.root = subtreeRemove(this.root, leaf, this);
        leaf.clearPairs(this);
    };
    BBTree.prototype.contains = function (shape) {
        return this.leaves.has(shape);
    };
    BBTree.prototype.reindex = function (shapes) {
        var _this = this;
        var leaves = shapes.map(function (shape) {
            return _this.leaves.get(shape);
        });
        leaves.forEach(function (leaf) {
            leaf.update(_this);
        });
        leaves.forEach(function (leaf) {
            leaf.markTouching(_this);
        });
        this.incrementStamp();
    };
    // **** Query
    BBTree.prototype.shapeQuery = function (shape, func) {
        var leaf = this.leaves.get(shape);
        if (leaf) {
            // Leaf is in the index.  Use the cached sets of touching leaves.
            leaf.touching.forEach(function (other) {
                func(other.shape);
            });
        }
        else {
            // Shape is not in the index.  Perform a regular query using the
            // shape's bounding box.
            // TODO use velocityFunc
            // TODO it's possible that we don't want to provide this fallback
            this.query(shape.getBB(), func);
        }
    };
    BBTree.prototype.pointQuery = function (v$$1, func) {
        this.query(new BB(v$$1.x, v$$1.y, v$$1.x, v$$1.y), func);
    };
    BBTree.prototype.segmentQuery = function (a, b, tExit, func) {
        if (this.root) {
            this.root.segmentQuery(a, b, tExit, func);
        }
    };
    BBTree.prototype.query = function (bb$$1, func) {
        if (this.root) {
            this.root.query(bb$$1, func);
        }
    };
    BBTree.prototype.each = function (func) {
        this.leaves.forEach(function (leaf) {
            func(leaf.shape);
        });
    };
    return BBTree;
}());
var BBTreeIndex = /** @class */ (function (_super) {
    __extends(BBTreeIndex, _super);
    function BBTreeIndex() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.tree = new BBTree();
        _this.activeShapes = new Set();
        return _this;
    }
    // **** Insert/Remove
    BBTreeIndex.prototype.insertStatic = function (shape) {
        this.tree.insert(shape);
        this.count++;
    };
    BBTreeIndex.prototype.insert = function (shape) {
        this.tree.insert(shape);
        this.activeShapes.add(shape);
        this.count++;
    };
    BBTreeIndex.prototype.remove = function (shape) {
        this.tree.remove(shape);
        this.activeShapes.delete(shape);
        this.count--;
    };
    BBTreeIndex.prototype.contains = function (shape) {
        return this.tree.contains(shape);
    };
    BBTreeIndex.prototype.reindexStatic = function () {
        var shapes = [];
        this.tree.leaves.forEach(function (leaf, shape) {
            shapes.push(shape);
        });
        this.tree.reindex(shapes);
    };
    BBTreeIndex.prototype.reindex = function () {
        var shapes = [];
        this.activeShapes.forEach(function (shape) {
            shapes.push(shape);
        });
        this.tree.reindex(shapes);
    };
    BBTreeIndex.prototype.reindexShape = function (shape) {
        this.tree.reindex([shape]);
    };
    // **** Query
    BBTreeIndex.prototype.touchingQuery = function (func) {
        var _this = this;
        var visited = new Set();
        this.activeShapes.forEach(function (shape) {
            _this.tree.shapeQuery(shape, function (other) {
                if (visited.has(other)) {
                    func(shape, other);
                }
                visited.add(shape);
            });
        });
    };
    BBTreeIndex.prototype.pointQuery = function (v$$1, func) {
        return this.tree.pointQuery(v$$1, func);
    };
    BBTreeIndex.prototype.segmentQuery = function (a, b, tExit, func) {
        return this.tree.segmentQuery(a, b, tExit, func);
    };
    BBTreeIndex.prototype.query = function (bb$$1, func) {
        this.tree.query(bb$$1, func);
    };
    BBTreeIndex.prototype.each = function (func) {
        this.tree.leaves.forEach(function (leaf) {
            func(leaf.shape);
        });
    };
    return BBTreeIndex;
}(SpatialIndex));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/// **** Sleeping Functions
function componentRoot(body) {
    return (body ? body.nodeRoot : null);
}
function componentActivate(root) {
    if (!root || !root.isSleeping()) {
        return;
    }
    assert(!root.isRogue(), "Internal Error: componentActivate() called on a rogue body.");
    var space = root.space;
    var body = root;
    while (body) {
        var next = body.nodeNext;
        body.nodeIdleTime = 0;
        body.nodeRoot = null;
        body.nodeNext = null;
        space.activateBody(body);
        body = next;
    }
    deleteObjFromList(space.sleepingComponents, root);
}
function componentAdd(root, body) {
    body.nodeRoot = root;
    if (body !== root) {
        body.nodeNext = root.nodeNext;
        root.nodeNext = body;
    }
}
function floodFillComponent(root, body) {
    // Rogue bodies cannot be put to sleep and prevent bodies they are touching
    // from sleeping anyway. Static bodies (which are a type of rogue body) are
    // effectively sleeping all the time.
    if (!body.isRogue()) {
        var otherRoot = componentRoot(body);
        if (otherRoot == null) {
            componentAdd(root, body);
            for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
                var other = (body === arb.bodyA
                    ? arb.bodyB
                    : arb.bodyA);
                floodFillComponent(root, other);
            }
            for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
                var other = (body === constraint.a
                    ? constraint.b
                    : constraint.a);
                floodFillComponent(root, other);
            }
        }
        else {
            assertSoft(otherRoot === root, "Internal Error: Inconsistency detected in the contact graph.");
        }
    }
}
function componentActive(root, threshold) {
    for (var body = root; body; body = body.nodeNext) {
        if (body.nodeIdleTime < threshold) {
            return true;
        }
    }
    return false;
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
function filterConstraints(node, body, filter) {
    if (node === filter) {
        return node.next(body);
    }
    else if (node.a === body) {
        node.nextA = filterConstraints(node.nextA, body, filter);
    }
    else {
        node.nextB = filterConstraints(node.nextB, body, filter);
    }
    return node;
}
var Body = /** @class */ (function () {
    function Body(m, i) {
        /// Position of the rigid body's center of gravity.
        this.p = new Vect(0, 0);
        /// Velocity of the rigid body's center of gravity.
        this.v = new Vect(0, 0);
        /// Force acting on the rigid body's center of gravity.
        this.f = new Vect(0, 0);
        /// Angular velocity of the body around it's center of gravity in radians
        /// per second.
        this.w = 0;
        /// Torque applied to the body around it's center of gravity.
        this.t = 0;
        /// Maximum velocity allowed when updating the velocity.
        this.vLimit = Infinity;
        /// Maximum rotational rate (in radians/second) allowed when updating the
        /// angular velocity.
        this.wLimit = Infinity;
        // This stuff is all private.
        this.vBias = new Vect(0, 0);
        this.wBias = 0;
        this.space = null;
        this.shapeList = [];
        // These are both wacky linked lists.
        this.arbiterList = null;
        this.constraintList = null;
        // This stuff is used to track information on the collision graph.
        // TODO
        this.nodeRoot = null;
        this.nodeNext = null;
        this.nodeIdleTime = 0;
        // Set this.m and this.m_inv
        this.setMass(m);
        // Set this.i and this.i_inv
        this.setMoment(i);
        // Set this.a and this.rot.
        this.setAngleInternal(0);
    }
    Body.prototype.getPos = function () {
        return this.p;
    };
    Body.prototype.getVel = function () {
        return this.v;
    };
    Body.prototype.getAngVel = function () {
        return this.w;
    };
    /// Returns true if the body is sleeping.
    Body.prototype.isSleeping = function () {
        return this.nodeRoot !== null;
    };
    /// Returns true if the body is static.
    Body.prototype.isStatic = function () {
        return this.nodeIdleTime === Infinity;
    };
    /// Returns true if the body has not been added to a space.
    Body.prototype.isRogue = function () {
        return this.space === null;
    };
    // It would be nicer to use defineProperty for this, but its about 30x
    // slower: http://jsperf.com/defineproperty-vs-setter
    Body.prototype.setMass = function (mass) {
        assert(mass > 0, "Mass must be positive and non-zero.");
        // activate is defined in cpSpaceComponent
        this.activate();
        this.mass = mass;
        this.massInv = 1 / mass;
    };
    Body.prototype.setMoment = function (moment) {
        assert(moment > 0, "Moment of Inertia must be positive and non-zero.");
        this.activate();
        this.inertia = moment;
        this.inertiaInv = 1 / moment;
    };
    Body.prototype.addShape = function (shape) {
        this.shapeList.push(shape);
    };
    Body.prototype.removeShape = function (shape) {
        // This implementation has a linear time complexity with the number of
        // shapes. The original implementation used linked lists instead, which
        // might be faster if you're constantly editing the shape of a body
        // I expect most bodies will never have their shape edited, so I'm just
        // going to use the simplest possible implemention.
        deleteObjFromList(this.shapeList, shape);
    };
    Body.prototype.removeConstraint = function (constraint) {
        // The constraint must be in the constraints list when this is called.
        this.constraintList = filterConstraints(this.constraintList, this, constraint);
    };
    Body.prototype.setPos = function (pos) {
        this.activate();
        this.sanityCheck();
        // If I allow the position to be set to vzero, vzero will get changed.
        if (pos === vzero) {
            pos = new Vect(0, 0);
        }
        this.p = pos;
    };
    Body.prototype.setVel = function (vel) {
        this.activate();
        this.v = vel;
    };
    Body.prototype.setAngVel = function (w) {
        this.activate();
        this.w = w;
    };
    Body.prototype.setAngleInternal = function (angle) {
        assert(!isNaN(angle), "Internal Error: Attempting to set body's angle to NaN");
        this.a = angle; // fmod(a, (cpFloat)M_PI*2.0f);
        // this.rot = vforangle(angle);
        this.rot = new Vect(Math.cos(angle), Math.sin(angle));
    };
    Body.prototype.setAngle = function (angle) {
        this.activate();
        this.sanityCheck();
        this.setAngleInternal(angle);
    };
    Body.prototype.velocity_func = function (gravity, damping, dt) {
        // this.v = vclamp(vadd(
        //     vmult(this.v, damping),
        //     vmult(vadd(gravity, vmult(this.f, this.m_inv)), dt)
        // ), this.v_limit);
        //
        var vx = (this.v.x * damping +
            (gravity.x + this.f.x * this.massInv) * dt);
        var vy = (this.v.y * damping +
            (gravity.y + this.f.y * this.massInv) * dt);
        // var v = vclamp(new Vect(vx, vy), this.v_limit);
        // this.vx = v.x; this.vy = v.y;
        var vLimit = this.vLimit;
        var lensq = vx * vx + vy * vy;
        var scale = ((lensq > vLimit * vLimit)
            ? vLimit / Math.sqrt(lensq)
            : 1);
        this.v = vmult(new Vect(vx, vy), scale);
        var wLimit = this.wLimit;
        this.w = clamp(this.w * damping + this.t * this.inertiaInv * dt, -wLimit, wLimit);
        this.sanityCheck();
    };
    Body.prototype.position_func = function (dt) {
        // this.p = vadd(this.p, vmult(vadd(this.v, this.v_bias), dt));
        // this.p = this.p + (this.v + this.v_bias) * dt;
        this.p = vadd(this.p, vmult(vadd(this.v, this.vBias), dt));
        this.setAngleInternal(this.a + (this.w + this.wBias) * dt);
        this.vBias = new Vect(0, 0);
        this.wBias = 0;
        this.sanityCheck();
    };
    Body.prototype.resetForces = function () {
        this.activate();
        this.f = new Vect(0, 0);
        this.t = 0;
    };
    Body.prototype.applyForce = function (force, r) {
        this.activate();
        this.f = vadd(this.f, force);
        this.t += vcross(r, force);
    };
    Body.prototype.applyImpulse = function (impulse, r) {
        this.activate();
        applyImpulse(this, impulse.x, impulse.y, r);
    };
    Body.prototype.getVelAtPoint = function (r) {
        return vadd(this.v, vmult(vperp(r), this.w));
    };
    /// Get the velocity on a body (in world units) at a point on the body in
    // world coordinates.
    Body.prototype.getVelAtWorldPoint = function (point) {
        return this.getVelAtPoint(vsub(point, this.p));
    };
    /// Get the velocity on a body (in world units) at a point on the body in
    // local coordinates.
    Body.prototype.getVelAtLocalPoint = function (point) {
        return this.getVelAtPoint(vrotate(point, this.rot));
    };
    Body.prototype.eachShape = function (func) {
        for (var i = 0, len = this.shapeList.length; i < len; i++) {
            func(this.shapeList[i]);
        }
    };
    Body.prototype.eachConstraint = function (func) {
        var constraint = this.constraintList;
        while (constraint) {
            var next = constraint.next(this);
            func(constraint);
            constraint = next;
        }
    };
    Body.prototype.eachArbiter = function (func) {
        var arb = this.arbiterList;
        while (arb) {
            var next = arb.next(this);
            arb.swappedColl = (this === arb.bodyB);
            func(arb);
            arb = next;
        }
    };
    /// Convert body relative/local coordinates to absolute/world coordinates.
    Body.prototype.local2World = function (v$$1) {
        return vadd(this.p, vrotate(v$$1, this.rot));
    };
    /// Convert body absolute/world coordinates to	relative/local coordinates.
    Body.prototype.world2Local = function (v$$1) {
        return vunrotate(vsub(v$$1, this.p), this.rot);
    };
    /// Get the kinetic energy of a body.
    Body.prototype.kineticEnergy = function () {
        // Need to do some fudging to avoid NaNs
        var vsq = this.v.x * this.v.x + this.v.y * this.v.y;
        var wsq = this.w * this.w;
        return (vsq ? vsq * this.mass : 0) + (wsq ? wsq * this.inertia : 0);
    };
    Body.prototype.sanityCheck = function () {
        assert(this.mass === this.mass && this.massInv === this.massInv, "Body's mass is invalid.");
        assert((this.inertia === this.inertia &&
            this.inertiaInv === this.inertiaInv), "Body's moment is invalid.");
        v_assert_sane(this.p, "Body's position is invalid.");
        v_assert_sane(this.f, "Body's force is invalid.");
        assert(this.v.x === this.v.x && Math.abs(this.v.x) !== Infinity, "Body's velocity is invalid.");
        assert(this.v.y === this.v.y && Math.abs(this.v.y) !== Infinity, "Body's velocity is invalid.");
        assert(this.a === this.a && Math.abs(this.a) !== Infinity, "Body's angle is invalid.");
        assert(this.w === this.w && Math.abs(this.w) !== Infinity, "Body's angular velocity is invalid.");
        assert(this.t === this.t && Math.abs(this.t) !== Infinity, "Body's torque is invalid.");
        v_assert_sane(this.rot, "Body's rotation vector is invalid.");
        assert(this.vLimit === this.vLimit, "Body's velocity limit is invalid.");
        assert(this.wLimit === this.wLimit, "Body's angular velocity limit is invalid.");
    };
    Body.prototype.activate = function () {
        if (!this.isRogue()) {
            this.nodeIdleTime = 0;
            componentActivate(componentRoot(this));
        }
    };
    Body.prototype.activateStatic = function (filter) {
        assert(this.isStatic(), "Body.activateStatic() called on a non-static body.");
        for (var arb = this.arbiterList; arb; arb = arb.next(this)) {
            if (!filter || filter === arb.shapeA || filter === arb.shapeB) {
                (arb.bodyA === this ? arb.bodyB : arb.bodyA).activate();
            }
        }
        // TODO should also activate joints!
    };
    Body.prototype.pushArbiter = function (arb) {
        assertSoft((arb.bodyA === this ? arb.threadNextA : arb.threadNextB) === null, "Internal Error: Dangling contact graph pointers detected. (A)");
        assertSoft((arb.bodyA === this ? arb.threadPrevA : arb.threadPrevB) === null, "Internal Error: Dangling contact graph pointers detected. (B)");
        var next = this.arbiterList;
        assertSoft((next === null ||
            (next.bodyA === this
                ? next.threadPrevA
                : next.threadPrevB) === null), "Internal Error: Dangling contact graph pointers detected. (C)");
        if (arb.bodyA === this) {
            arb.threadNextA = next;
        }
        else {
            arb.threadNextB = next;
        }
        if (next) {
            if (next.bodyA === this) {
                next.threadPrevA = arb;
            }
            else {
                next.threadPrevB = arb;
            }
        }
        this.arbiterList = arb;
    };
    Body.prototype.sleep = function () {
        this.sleepWithGroup(null);
    };
    Body.prototype.sleepWithGroup = function (group) {
        assert(!this.isStatic() && !this.isRogue(), "Rogue and static bodies cannot be put to sleep.");
        var space = this.space;
        assert(space, "Cannot put a rogue body to sleep.");
        assert(!space.locked, "Bodies cannot be put to sleep during a query or a call to " +
            "cpSpaceStep(). Put these calls into a post-step callback.");
        assert(group === null || group.isSleeping(), "Cannot use a non-sleeping body as a group identifier.");
        if (this.isSleeping()) {
            assert(componentRoot(this) === componentRoot(group), "The body is already sleeping and it's group cannot be " +
                "reassigned.");
            return;
        }
        for (var _i = 0, _a = this.shapeList; _i < _a.length; _i++) {
            var shape = _a[_i];
            shape.update(this.p, this.rot);
        }
        space.deactivateBody(this);
        if (group) {
            var root = componentRoot(group);
            this.nodeRoot = root;
            this.nodeNext = root.nodeNext;
            this.nodeIdleTime = 0;
            root.nodeNext = this;
        }
        else {
            this.nodeRoot = this;
            this.nodeNext = null;
            this.nodeIdleTime = 0;
            space.sleepingComponents.push(this);
        }
        deleteObjFromList(space.bodies, this);
    };
    return Body;
}());
function v_assert_nan(v$$1, message) {
    assert(v$$1.x === v$$1.x && v$$1.y === v$$1.y, message);
}
function v_assert_infinite(v$$1, message) {
    assert(Math.abs(v$$1.x) !== Infinity && Math.abs(v$$1.y) !== Infinity, message);
}
function v_assert_sane(v$$1, message) {
    v_assert_nan(v$$1, message);
    v_assert_infinite(v$$1, message);
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var shapeIDCounter = 0;
// tslint:disable-next-line
var CP_ALL_LAYERS = ~0;
/// The cpShape struct defines the shape of a rigid body.
//
/// Opaque collision shape struct. Do not create directly - instead use
/// PolyShape, CircleShape and SegmentShape.
var Shape = /** @class */ (function () {
    function Shape(body) {
        /// The rigid body this collision shape is attached to.
        this.body = body;
        /// The current bounding box of the shape.
        this.bbL = this.bbB = this.bbR = this.bbT = 0;
        this.hashid = shapeIDCounter++;
        /// Sensor flag.
        /// Sensor shapes call collision callbacks but don't produce collisions.
        this.sensor = false;
        /// Coefficient of restitution. (elasticity)
        this.restitutionCoef = 0;
        /// Coefficient of friction.
        this.frictionCoef = 0;
        /// Surface velocity used when solving for friction.
        this.surfaceVelocity = vzero;
        /// Collision type of this shape used when picking collision handlers.
        this.collisionType = 0;
        /// Group of this shape. Shapes in the same group don't collide.
        this.group = 0;
        // Layer bitmask for this shape. Shapes only collide if the bitwise and
        // of their layers is non-zero.
        this.layers = CP_ALL_LAYERS;
        this.space = null;
    }
    Shape.prototype.setElasticity = function (e) {
        this.restitutionCoef = e;
    };
    Shape.prototype.setFriction = function (u) {
        this.body.activate();
        this.frictionCoef = u;
    };
    Shape.prototype.setLayers = function (layers) {
        this.body.activate();
        this.layers = layers;
    };
    Shape.prototype.setSensor = function (sensor) {
        this.body.activate();
        this.sensor = sensor;
    };
    Shape.prototype.setCollisionType = function (collisionType) {
        this.body.activate();
        this.collisionType = collisionType;
    };
    Shape.prototype.getBody = function () {
        return this.body;
    };
    Shape.prototype.active = function () {
        return this.body && this.body.shapeList.indexOf(this) !== -1;
    };
    Shape.prototype.setBody = function (body) {
        assert(!this.active(), "You cannot change the body on an active shape. You must remove " +
            "the shape from the space before changing the body.");
        this.body = body;
    };
    Shape.prototype.cacheBB = function () {
        return this.update(this.body.p, this.body.rot);
    };
    Shape.prototype.update = function (pos, rot) {
        assert(!isNaN(rot.x), "Rotation is NaN");
        assert(!isNaN(pos.x), "Position is NaN");
        this.cacheData(pos, rot);
    };
    Shape.prototype.pointQuery = function (p) {
        var info = this.nearestPointQuery(p);
        if (info.d < 0) {
            return info;
        }
    };
    Shape.prototype.getBB = function () {
        return new BB(this.bbL, this.bbB, this.bbR, this.bbT);
    };
    return Shape;
}());
var NearestPointQueryInfo = /** @class */ (function () {
    function NearestPointQueryInfo(shape, p, d) {
        /// The nearest shape, NULL if no shape was within range.
        this.shape = shape;
        /// The closest point on the shape's surface, in world space
        /// coordinates.
        this.p = p;
        /// The distance to the point. The distance is negative if the point is
        /// inside the shape.
        this.d = d;
    }
    return NearestPointQueryInfo;
}());
var SegmentQueryInfo = /** @class */ (function () {
    function SegmentQueryInfo(shape, t, n) {
        /// The shape that was hit, NULL if no collision occured.
        this.shape = shape;
        /// The normalized distance along the query segment in the range [0, 1].
        this.t = t;
        /// The normal of the surface hit.
        this.n = n;
    }
    /// Get the hit point for a segment query.
    SegmentQueryInfo.prototype.hitPoint = function (start, end) {
        return vlerp(start, end, this.t);
    };
    /// Get the hit distance for a segment query.
    SegmentQueryInfo.prototype.hitDist = function (start, end) {
        return vdist(start, end) * this.t;
    };
    return SegmentQueryInfo;
}());

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
function circleSegmentQuery(shape, center, r, a, b) {
    // offset the line to be relative to the circle
    a = vsub(a, center);
    b = vsub(b, center);
    var qa = vdot(a, a) - 2 * vdot(a, b) + vdot(b, b);
    var qb = -2 * vdot(a, a) + 2 * vdot(a, b);
    var qc = vdot(a, a) - r * r;
    var det = qb * qb - 4 * qa * qc;
    if (det >= 0) {
        var t = (-qb - Math.sqrt(det)) / (2 * qa);
        if (0 <= t && t <= 1) {
            return new SegmentQueryInfo(shape, t, vnormalize(vlerp(a, b, t)));
        }
    }
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var CircleShape = /** @class */ (function (_super) {
    __extends(CircleShape, _super);
    function CircleShape(body, radius, offset) {
        var _this = _super.call(this, body) || this;
        _this.center = _this.tc = offset;
        _this.radius = radius;
        _this.type = "circle";
        return _this;
    }
    CircleShape.prototype.cacheData = function (p, rot) {
        var c = this.tc = vadd(p, vrotate(this.center, rot));
        var r = this.radius;
        this.bbL = c.x - r;
        this.bbB = c.y - r;
        this.bbR = c.x + r;
        this.bbT = c.y + r;
    };
    CircleShape.prototype.nearestPointQuery = function (p) {
        var deltax = p.x - this.tc.x;
        var deltay = p.y - this.tc.y;
        var d = vlength2(deltax, deltay);
        var r = this.radius;
        var nearestp = new Vect(this.tc.x + deltax * r / d, this.tc.y + deltay * r / d);
        return new NearestPointQueryInfo(this, nearestp, d - r);
    };
    CircleShape.prototype.segmentQuery = function (a, b) {
        return circleSegmentQuery(this, this.tc, this.radius, a, b);
    };
    return CircleShape;
}(Shape));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var SegmentShape = /** @class */ (function (_super) {
    __extends(SegmentShape, _super);
    function SegmentShape(body, a, b, r) {
        var _this = _super.call(this, body) || this;
        _this.a = a;
        _this.b = b;
        _this.n = vperp(vnormalize(vsub(b, a)));
        _this.ta = _this.tb = _this.tn = null;
        _this.r = r;
        _this.tangentA = vzero;
        _this.tangentB = vzero;
        _this.type = "segment";
        return _this;
    }
    SegmentShape.prototype.cacheData = function (p, rot) {
        this.ta = vadd(p, vrotate(this.a, rot));
        this.tb = vadd(p, vrotate(this.b, rot));
        this.tn = vrotate(this.n, rot);
        var l;
        var r;
        var b;
        var t;
        if (this.ta.x < this.tb.x) {
            l = this.ta.x;
            r = this.tb.x;
        }
        else {
            l = this.tb.x;
            r = this.ta.x;
        }
        if (this.ta.y < this.tb.y) {
            b = this.ta.y;
            t = this.tb.y;
        }
        else {
            b = this.tb.y;
            t = this.ta.y;
        }
        var rad = this.r;
        this.bbL = l - rad;
        this.bbB = b - rad;
        this.bbR = r + rad;
        this.bbT = t + rad;
    };
    SegmentShape.prototype.nearestPointQuery = function (p) {
        var closest = closestPointOnSegment(p, this.ta, this.tb);
        var deltax = p.x - closest.x;
        var deltay = p.y - closest.y;
        var d = vlength2(deltax, deltay);
        var r = this.r;
        var nearestp = (d ? vadd(closest, vmult(new Vect(deltax, deltay), r / d)) : closest);
        return new NearestPointQueryInfo(this, nearestp, d - r);
    };
    SegmentShape.prototype.segmentQuery = function (a, b) {
        var n = this.tn;
        var d = vdot(vsub(this.ta, a), n);
        var r = this.r;
        var flippedNormal = (d > 0 ? vneg(n) : n);
        var normalOffset = vsub(vmult(flippedNormal, r), a);
        var segA = vadd(this.ta, normalOffset);
        var segB = vadd(this.tb, normalOffset);
        var delta = vsub(b, a);
        if (vcross(delta, segA) * vcross(delta, segB) <= 0) {
            var dOffset = d + (d > 0 ? -r : r);
            var ad = -dOffset;
            var bd = vdot(delta, n) - dOffset;
            if (ad * bd < 0) {
                return new SegmentQueryInfo(this, ad / (ad - bd), flippedNormal);
            }
        }
        else if (r !== 0) {
            var info1 = circleSegmentQuery(this, this.ta, this.r, a, b);
            var info2 = circleSegmentQuery(this, this.tb, this.r, a, b);
            if (info1) {
                return info2 && info2.t < info1.t ? info2 : info1;
            }
            else {
                return info2;
            }
        }
    };
    SegmentShape.prototype.setNeighbors = function (prev, next) {
        this.tangentA = vsub(prev, this.a);
        this.tangentB = vsub(next, this.b);
    };
    SegmentShape.prototype.setEndpoints = function (a, b) {
        this.a = a;
        this.b = b;
        this.n = vperp(vnormalize(vsub(b, a)));
    };
    return SegmentShape;
}(Shape));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/// Check that a set of vertexes is convex and has a clockwise winding.
function polyValidate(verts) {
    var len = verts.length;
    for (var i = 0; i < len; i += 2) {
        var ax = verts[i];
        var ay = verts[i + 1];
        var bx = verts[(i + 2) % len];
        var by = verts[(i + 3) % len];
        var cx = verts[(i + 4) % len];
        var cy = verts[(i + 5) % len];
        // if(vcross(vsub(b, a), vsub(c, b)) > 0){
        if (vcross2(bx - ax, by - ay, cx - bx, cy - by) > 0) {
            return false;
        }
    }
    return true;
}
var SplittingPlane = /** @class */ (function () {
    function SplittingPlane(n, d) {
        this.n = n;
        this.d = d;
    }
    SplittingPlane.prototype.compare = function (vect) {
        return vdot(this.n, vect) - this.d;
    };
    return SplittingPlane;
}());
/// Initialize a polygon shape.
/// The vertexes must be convex and have a clockwise winding.
var PolyShape = /** @class */ (function (_super) {
    __extends(PolyShape, _super);
    function PolyShape(body, verts, offset) {
        var _this = _super.call(this, body) || this;
        _this.setVerts(verts, offset);
        _this.type = "poly";
        return _this;
    }
    PolyShape.prototype.setVerts = function (verts, offset) {
        assert(verts.length >= 4, "Polygons require some verts");
        assert(typeof (verts[0]) === "number", "Polygon verticies should be specified in a flattened list " +
            "(eg [x1,y1,x2,y2,x3,y3,...])");
        // Fail if the user attempts to pass a concave poly, or a bad winding.
        assert(polyValidate(verts), "Polygon is concave or has a reversed winding. " +
            "Consider using cpConvexHull()");
        var len = verts.length;
        var numVerts = len / 2;
        // This a pretty bad way to do this in javascript. As a first pass, I
        // want to keep the code similar to the C.
        this.verts = new Array(len);
        this.tVerts = new Array(len);
        this.planes = new Array(numVerts);
        this.tPlanes = new Array(numVerts);
        for (var i = 0; i < len; i += 2) {
            // var a = vadd(offset, verts[i]);
            // var b = vadd(offset, verts[(i+1)%numVerts]);
            var ax = verts[i] + offset.x;
            var ay = verts[i + 1] + offset.y;
            var bx = verts[(i + 2) % len] + offset.x;
            var by = verts[(i + 3) % len] + offset.y;
            // Inefficient, but only called during object initialization.
            var n = vnormalize(vperp(new Vect(bx - ax, by - ay)));
            this.verts[i] = ax;
            this.verts[i + 1] = ay;
            this.planes[i / 2] = new SplittingPlane(n, vdot2(n.x, n.y, ax, ay));
            this.tPlanes[i / 2] = new SplittingPlane(new Vect(0, 0), 0);
        }
    };
    PolyShape.prototype.transformVerts = function (p, rot) {
        var src = this.verts;
        var dst = this.tVerts;
        var l = Infinity;
        var r = -Infinity;
        var b = Infinity;
        var t = -Infinity;
        for (var i = 0; i < src.length; i += 2) {
            // var v = vadd(p, vrotate(src[i], rot));
            var x = src[i];
            var y = src[i + 1];
            var vx = p.x + x * rot.x - y * rot.y;
            var vy = p.y + x * rot.y + y * rot.x;
            dst[i] = vx;
            dst[i + 1] = vy;
            l = Math.min(l, vx);
            r = Math.max(r, vx);
            b = Math.min(b, vy);
            t = Math.max(t, vy);
        }
        this.bbL = l;
        this.bbB = b;
        this.bbR = r;
        this.bbT = t;
    };
    PolyShape.prototype.transformAxes = function (p, rot) {
        var src = this.planes;
        var dst = this.tPlanes;
        for (var i = 0; i < src.length; i++) {
            var n = vrotate(src[i].n, rot);
            dst[i].n = n;
            dst[i].d = vdot(p, n) + src[i].d;
        }
    };
    PolyShape.prototype.cacheData = function (p, rot) {
        this.transformAxes(p, rot);
        this.transformVerts(p, rot);
    };
    PolyShape.prototype.nearestPointQuery = function (p) {
        var planes = this.tPlanes;
        var verts = this.tVerts;
        var v0x = verts[verts.length - 2];
        var v0y = verts[verts.length - 1];
        var minDist = Infinity;
        var closestPoint = vzero;
        var outside = false;
        for (var i = 0; i < planes.length; i++) {
            if (planes[i].compare(p) > 0) {
                outside = true;
            }
            var v1x = verts[i * 2];
            var v1y = verts[i * 2 + 1];
            var closest = closestPointOnSegment2(p.x, p.y, v0x, v0y, v1x, v1y);
            var dist = vdist(p, closest);
            if (dist < minDist) {
                minDist = dist;
                closestPoint = closest;
            }
            v0x = v1x;
            v0y = v1y;
        }
        return new NearestPointQueryInfo(this, closestPoint, (outside ? minDist : -minDist));
    };
    PolyShape.prototype.segmentQuery = function (a, b) {
        var axes = this.tPlanes;
        var verts = this.tVerts;
        var numVerts = axes.length;
        var len = numVerts * 2;
        for (var i = 0; i < numVerts; i++) {
            var n = axes[i].n;
            var an = vdot(a, n);
            if (axes[i].d > an) {
                continue;
            }
            var bn = vdot(b, n);
            var t = (axes[i].d - an) / (bn - an);
            if (t < 0 || 1 < t) {
                continue;
            }
            var point = vlerp(a, b, t);
            var dt = -vcross(n, point);
            var dtMin = -vcross(v(n.x, n.y), v(verts[i * 2], verts[i * 2 + 1]));
            var dtMax = -vcross(v(n.x, n.y), v(verts[(i * 2 + 2) % len], verts[(i * 2 + 3) % len]));
            if (dtMin <= dt && dt <= dtMax) {
                // josephg: In the original C code, this function keeps
                // looping through axes after finding a match. I *think*
                // this code is equivalent...
                return new SegmentQueryInfo(this, t, n);
            }
        }
    };
    PolyShape.prototype.valueOnAxis = function (n, d) {
        var verts = this.tVerts;
        var m = vdot2(n.x, n.y, verts[0], verts[1]);
        for (var i = 2; i < verts.length; i += 2) {
            m = Math.min(m, vdot2(n.x, n.y, verts[i], verts[i + 1]));
        }
        return m - d;
    };
    PolyShape.prototype.containsVert = function (vx, vy) {
        var planes = this.tPlanes;
        for (var _i = 0, planes_1 = planes; _i < planes_1.length; _i++) {
            var plane = planes_1[_i];
            var n = plane.n;
            var dist = vdot2(n.x, n.y, vx, vy) - plane.d;
            if (dist > 0) {
                return false;
            }
        }
        return true;
    };
    PolyShape.prototype.containsVertPartial = function (vx, vy, n) {
        var planes = this.tPlanes;
        for (var _i = 0, planes_2 = planes; _i < planes_2.length; _i++) {
            var plane = planes_2[_i];
            var n2 = plane.n;
            if (vdot(n2, n) < 0) {
                continue;
            }
            var dist = vdot2(n2.x, n2.y, vx, vy) - plane.d;
            if (dist > 0) {
                return false;
            }
        }
        return true;
    };
    // These methods are provided for API compatibility with Chipmunk. I
    // recommend against using them - just access the poly.verts list directly.
    PolyShape.prototype.getNumVerts = function () {
        return this.verts.length / 2;
    };
    PolyShape.prototype.getVert = function (i) {
        return new Vect(this.verts[i * 2], this.verts[i * 2 + 1]);
    };
    return PolyShape;
}(Shape));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var BoxShape = /** @class */ (function (_super) {
    __extends(BoxShape, _super);
    function BoxShape(body, width, height) {
        var _this = this;
        var verts = [
            -0.5 * width, -0.5 * height,
            -0.5 * width, 0.5 * height,
            0.5 * width, 0.5 * height,
            0.5 * width, -0.5 * height,
        ];
        _this = _super.call(this, body, verts, vzero) || this;
        return _this;
    }
    return BoxShape;
}(PolyShape));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var Contact = /** @class */ (function () {
    function Contact(p, n, dist, hash) {
        this.nMass = 0;
        this.tMass = 0;
        this.bounce = 0;
        this.bias = 0;
        this.jnAcc = 0;
        this.jtAcc = 0;
        this.jBias = 0;
        this.p = p;
        this.n = n;
        this.dist = dist;
        this.r1 = this.r2 = vzero;
        this.hash = hash;
    }
    return Contact;
}());
// Add contact points for circle to circle collisions.
// Used by several collision tests.
function circle2circleQuery(p1, p2, r1, r2) {
    var mindist = r1 + r2;
    var delta = vsub(p2, p1);
    var distsq = vlengthsq(delta);
    if (distsq >= mindist * mindist) {
        return;
    }
    var dist = Math.sqrt(distsq);
    // Allocate and initialize the contact.
    return new Contact(vadd(p1, vmult(delta, 0.5 + (r1 - 0.5 * mindist) / (dist ? dist : Infinity))), (dist ? vmult(delta, 1 / dist) : new Vect(1, 0)), dist - mindist, 0);
}
// Collide circle shapes.
function circle2circle(circ1, circ2) {
    var contact = circle2circleQuery(circ1.tc, circ2.tc, circ1.radius, circ2.radius);
    return contact ? [contact] : [];
}
function circle2segment(circleShape, segmentShape) {
    var segA = segmentShape.ta;
    var segB = segmentShape.tb;
    var center = circleShape.tc;
    var segDelta = vsub(segB, segA);
    var closestT = clamp01(vdot(segDelta, vsub(center, segA)) / vlengthsq(segDelta));
    var closest = vadd(segA, vmult(segDelta, closestT));
    var contact = circle2circleQuery(center, closest, circleShape.radius, segmentShape.r);
    if (contact) {
        var n = contact.n;
        // Reject endcap collisions if tangents are provided.
        return ((closestT === 0 && vdot(n, segmentShape.tangentA) < 0) ||
            (closestT === 1 && vdot(n, segmentShape.tangentB) < 0)) ? [] : [contact];
    }
    else {
        return [];
    }
}
function segment2segment(seg1, seg2) {
    return [];
}
// Find the minimum separating axis for the given poly and axis list.
//
// This function needs to return two values - the index of the min. separating
// axis and the value itself. Short of inlining MSA, returning values through a
// global like this is the fastest implementation.
//
// See: http://jsperf.com/return-two-values-from-function/2
var lastMsaMin = 0;
function findMSA(poly, planes) {
    var indexMin = 0;
    var min = poly.valueOnAxis(planes[0].n, planes[0].d);
    if (min > 0) {
        return -1;
    }
    for (var i = 1; i < planes.length; i++) {
        var dist = poly.valueOnAxis(planes[i].n, planes[i].d);
        if (dist > 0) {
            return -1;
        }
        else if (dist > min) {
            min = dist;
            indexMin = i;
        }
    }
    lastMsaMin = min;
    return indexMin;
}
// Add contacts for probably penetrating vertexes.
// This handles the degenerate case where an overlap was detected, but no
// vertexes fall inside the opposing polygon. (like a star of david)
function findVertsFallback(poly1, poly2, n, dist) {
    var arr = [];
    var verts1 = poly1.tVerts;
    for (var i = 0; i < verts1.length; i += 2) {
        var vx = verts1[i];
        var vy = verts1[i + 1];
        if (poly2.containsVertPartial(vx, vy, vneg(n))) {
            arr.push(new Contact(new Vect(vx, vy), n, dist, hashPair(poly1.hashid, i)));
        }
    }
    var verts2 = poly2.tVerts;
    for (var i = 0; i < verts2.length; i += 2) {
        var vx = verts2[i];
        var vy = verts2[i + 1];
        if (poly1.containsVertPartial(vx, vy, n)) {
            arr.push(new Contact(new Vect(vx, vy), n, dist, hashPair(poly2.hashid, i)));
        }
    }
    return arr;
}
// Add contacts for penetrating vertexes.
function findVerts(poly1, poly2, n, dist) {
    var arr = [];
    var verts1 = poly1.tVerts;
    for (var i = 0; i < verts1.length; i += 2) {
        var vx = verts1[i];
        var vy = verts1[i + 1];
        if (poly2.containsVert(vx, vy)) {
            arr.push(new Contact(new Vect(vx, vy), n, dist, hashPair(poly1.hashid, i >> 1)));
        }
    }
    var verts2 = poly2.tVerts;
    for (var i = 0; i < verts2.length; i += 2) {
        var vx = verts2[i];
        var vy = verts2[i + 1];
        if (poly1.containsVert(vx, vy)) {
            arr.push(new Contact(new Vect(vx, vy), n, dist, hashPair(poly2.hashid, i >> 1)));
        }
    }
    return (arr.length ? arr : findVertsFallback(poly1, poly2, n, dist));
}
// Collide poly shapes together.
function poly2poly(poly1, poly2) {
    var mini1 = findMSA(poly2, poly1.tPlanes);
    if (mini1 === -1) {
        return [];
    }
    var min1 = lastMsaMin;
    var mini2 = findMSA(poly1, poly2.tPlanes);
    if (mini2 === -1) {
        return [];
    }
    var min2 = lastMsaMin;
    // There is overlap, find the penetrating verts
    if (min1 > min2) {
        return findVerts(poly1, poly2, poly1.tPlanes[mini1].n, min1);
    }
    else {
        return findVerts(poly1, poly2, vneg(poly2.tPlanes[mini2].n), min2);
    }
}
// Like cpPolyValueOnAxis(), but for segments.
function segValueOnAxis(seg, n, d) {
    var a = vdot(n, seg.ta) - seg.r;
    var b = vdot(n, seg.tb) - seg.r;
    return Math.min(a, b) - d;
}
// Identify vertexes that have penetrated the segment.
function findPointsBehindSeg(arr, seg, poly, pDist, coef) {
    var dta = vcross(seg.tn, seg.ta);
    var dtb = vcross(seg.tn, seg.tb);
    var n = vmult(seg.tn, coef);
    var verts = poly.tVerts;
    for (var i = 0; i < verts.length; i += 2) {
        var vx = verts[i];
        var vy = verts[i + 1];
        if (vdot2(vx, vy, n.x, n.y) < vdot(seg.tn, seg.ta) * coef + seg.r) {
            var dt = vcross2(seg.tn.x, seg.tn.y, vx, vy);
            if (dta >= dt && dt >= dtb) {
                arr.push(new Contact(new Vect(vx, vy), n, pDist, hashPair(poly.hashid, i)));
            }
        }
    }
}
// This one is complicated and gross. Just don't go there...
// TODO: Comment me!
function segment2poly(seg, poly) {
    var arr = [];
    var planes = poly.tPlanes;
    var numVerts = planes.length;
    var segD = vdot(seg.tn, seg.ta);
    var minNorm = poly.valueOnAxis(seg.tn, segD) - seg.r;
    var minNeg = poly.valueOnAxis(vneg(seg.tn), -segD) - seg.r;
    if (minNeg > 0 || minNorm > 0) {
        return [];
    }
    var mini = 0;
    var polyMin = segValueOnAxis(seg, planes[0].n, planes[0].d);
    if (polyMin > 0) {
        return [];
    }
    for (var i = 0; i < numVerts; i++) {
        var dist = segValueOnAxis(seg, planes[i].n, planes[i].d);
        if (dist > 0) {
            return [];
        }
        else if (dist > polyMin) {
            polyMin = dist;
            mini = i;
        }
    }
    var polyN = vneg(planes[mini].n);
    var va = vadd(seg.ta, vmult(polyN, seg.r));
    var vb = vadd(seg.tb, vmult(polyN, seg.r));
    if (poly.containsVert(va.x, va.y)) {
        arr.push(new Contact(va, polyN, polyMin, hashPair(seg.hashid, 0)));
    }
    if (poly.containsVert(vb.x, vb.y)) {
        arr.push(new Contact(vb, polyN, polyMin, hashPair(seg.hashid, 1)));
    }
    // Floating point precision problems here.
    // This will have to do for now.
    // poly_min -= cp_collision_slop; // TODO is this needed anymore?
    if (minNorm >= polyMin || minNeg >= polyMin) {
        if (minNorm > minNeg) {
            findPointsBehindSeg(arr, seg, poly, minNorm, 1);
        }
        else {
            findPointsBehindSeg(arr, seg, poly, minNeg, -1);
        }
    }
    // If no other collision points are found, try colliding endpoints.
    if (arr.length === 0) {
        var mini2 = mini * 2;
        var verts = poly.tVerts;
        var polyA = new Vect(verts[mini2], verts[mini2 + 1]);
        var con = void 0;
        con = circle2circleQuery(seg.ta, polyA, seg.r, 0);
        if (con) {
            return [con];
        }
        con = circle2circleQuery(seg.tb, polyA, seg.r, 0);
        if (con) {
            return [con];
        }
        var len = numVerts * 2;
        var polyB = new Vect(verts[(mini2 + 2) % len], verts[(mini2 + 3) % len]);
        con = circle2circleQuery(seg.ta, polyB, seg.r, 0);
        if (con) {
            return [con];
        }
        con = circle2circleQuery(seg.tb, polyB, seg.r, 0);
        if (con) {
            return [con];
        }
    }
    // console.log(poly.tVerts, poly.tPlanes);
    // console.log('seg2poly', arr);
    return arr;
}
// This one is less gross, but still gross.
// TODO: Comment me!
function circle2poly(circ, poly) {
    var planes = poly.tPlanes;
    var mini = 0;
    var min = vdot(planes[0].n, circ.tc) - planes[0].d - circ.radius;
    for (var i = 0; i < planes.length; i++) {
        var dist = vdot(planes[i].n, circ.tc) - planes[i].d - circ.radius;
        if (dist > 0) {
            return [];
        }
        else if (dist > min) {
            min = dist;
            mini = i;
        }
    }
    var n = planes[mini].n;
    var verts = poly.tVerts;
    var len = verts.length;
    var mini2 = mini << 1;
    var ax = verts[mini2];
    var ay = verts[mini2 + 1];
    var bx = verts[(mini2 + 2) % len];
    var by = verts[(mini2 + 3) % len];
    var dta = vcross2(n.x, n.y, ax, ay);
    var dtb = vcross2(n.x, n.y, bx, by);
    var dt = vcross(n, circ.tc);
    if (dt < dtb) {
        var con = circle2circleQuery(circ.tc, new Vect(bx, by), circ.radius, 0);
        return con ? [con] : [];
    }
    else if (dt < dta) {
        return [new Contact(vsub(circ.tc, vmult(n, circ.radius + min / 2)), vneg(n), min, 0)];
    }
    else {
        var con = circle2circleQuery(circ.tc, new Vect(ax, ay), circ.radius, 0);
        return con ? [con] : [];
    }
}
// The javascripty way to do this would be either nested object or methods on
// the prototypes.
//
// However, the *fastest* way is the method below.
// See: http://jsperf.com/dispatch
// These are copied from the prototypes into the actual objects in the Shape
// constructor.
CircleShape.prototype.collisionCode = 0;
SegmentShape.prototype.collisionCode = 1;
PolyShape.prototype.collisionCode = 2;
CircleShape.prototype.collisionTable = [
    circle2circle,
    circle2segment,
    circle2poly,
];
SegmentShape.prototype.collisionTable = [
    null,
    segment2segment,
    segment2poly,
];
PolyShape.prototype.collisionTable = [
    null,
    null,
    poly2poly,
];
function collideShapes(a, b) {
    assert(a.collisionCode <= b.collisionCode, "Collided shapes must be sorted by type");
    return a.collisionTable[b.collisionCode](a, b);
}

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// TODO: Comment me!
// a and b are bodies that the constraint applies to.
var Constraint = /** @class */ (function () {
    function Constraint(a, b) {
        /// The first body connected to this constraint.
        this.a = a;
        /// The second body connected to this constraint.
        this.b = b;
        this.space = null;
        this.nextA = null;
        this.nextB = null;
        /// The maximum force that this constraint is allowed to use.
        this.maxForce = Infinity;
        /// The rate at which joint error is corrected.
        /// Defaults to pow(1 - 0.1, 60) meaning that it will
        /// correct 10% of the error every 1/60th of a second.
        this.errorBias = Math.pow((1 - 0.1), 60);
        /// The maximum rate at which joint error is corrected.
        this.maxBias = Infinity;
    }
    Constraint.prototype.activateBodies = function () {
        if (this.a) {
            this.a.activate();
        }
        if (this.b) {
            this.b.activate();
        }
    };
    /// These methods are overridden by the constraint itself.
    Constraint.prototype.preStep = function (dt) {
        // Pass.
    };
    Constraint.prototype.applyCachedImpulse = function (dtCoef) {
        // Pass.
    };
    Constraint.prototype.applyImpulse = function () {
        // Pass.
    };
    Constraint.prototype.getImpulse = function () {
        return 0;
    };
    /// Function called before the solver runs. This can be overridden by the
    /// user to customize the constraint.  Animate your joint anchors, update
    /// your motor torque, etc.
    Constraint.prototype.preSolve = function (space) {
        // Pass.
    };
    /// Function called after the solver runs. This can be overridden by the
    /// user to customize the constraint.  Use the applied impulse to perform
    /// effects like breakable joints.
    Constraint.prototype.postSolve = function (space) {
        // Pass.
    };
    Constraint.prototype.next = function (body) {
        return (this.a === body ? this.nextA : this.nextB);
    };
    return Constraint;
}());

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
function defaultSpringTorque(spring, relativeAngle) {
    return (relativeAngle - spring.restAngle) * spring.stiffness;
}
var DampedRotarySpring = /** @class */ (function (_super) {
    __extends(DampedRotarySpring, _super);
    function DampedRotarySpring(a, b, restAngle, stiffness, damping) {
        var _this = _super.call(this, a, b) || this;
        _this.restAngle = restAngle;
        _this.stiffness = stiffness;
        _this.damping = damping;
        _this.springTorqueFunc = defaultSpringTorque;
        _this.targetNormalRelativeRate = 0;
        _this.dragCoef = 0;
        _this.iSum = 0;
        return _this;
    }
    DampedRotarySpring.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        var moment = a.inertiaInv + b.inertiaInv;
        assertSoft(moment !== 0, "Unsolvable spring.");
        this.iSum = 1 / moment;
        this.dragCoef = 1 - Math.exp(-this.damping * dt * moment);
        this.targetNormalRelativeRate = 0;
        // apply this torque
        var springTorque = this.springTorqueFunc(this, a.a - b.a) * dt;
        a.w -= springTorque * a.inertiaInv;
        b.w += springTorque * b.inertiaInv;
    };
    DampedRotarySpring.prototype.applyImpulse = function () {
        var a = this.a;
        var b = this.b;
        // compute relative velocity
        // normal_relative_velocity(a, b, r1, r2, n) - this.target_vrn;
        var normalRelativeRate = a.w - b.w;
        // compute velocity loss from drag
        // not 100% certain spring is derived correctly, though it makes sense
        var rateDamped = (this.targetNormalRelativeRate - normalRelativeRate) * this.dragCoef;
        this.targetNormalRelativeRate = normalRelativeRate + rateDamped;
        // apply_impulses(
        //     a, b, this.r1, this.r2, vmult(this.n, v_damp*this.nMass),
        // );
        var torqueDamped = rateDamped * this.iSum;
        a.w += torqueDamped * a.inertiaInv;
        b.w -= torqueDamped * b.inertiaInv;
    };
    return DampedRotarySpring;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
function defaultSpringForce(spring, dist) {
    return (spring.restLength - dist) * spring.stiffness;
}
var DampedSpring = /** @class */ (function (_super) {
    __extends(DampedSpring, _super);
    function DampedSpring(a, b, anchr1, anchr2, restLength, stiffness, damping) {
        var _this = _super.call(this, a, b) || this;
        _this.anchr1 = anchr1;
        _this.anchr2 = anchr2;
        _this.restLength = restLength;
        _this.stiffness = stiffness;
        _this.damping = damping;
        _this.springForceFunc = defaultSpringForce;
        _this.targetNormalRelativeVelocity = _this.dragCoef = 0;
        _this.r1 = _this.r2 = null;
        _this.nMass = 0;
        _this.n = null;
        return _this;
    }
    DampedSpring.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        this.r1 = vrotate(this.anchr1, a.rot);
        this.r2 = vrotate(this.anchr2, b.rot);
        var delta = vsub(vadd(b.p, this.r2), vadd(a.p, this.r1));
        var dist = vlength(delta);
        this.n = vmult(delta, 1 / (dist ? dist : Infinity));
        var k = kScalar(a, b, this.r1, this.r2, this.n);
        assertSoft(k !== 0, "Unsolvable this.");
        this.nMass = 1 / k;
        this.targetNormalRelativeVelocity = 0;
        this.dragCoef = 1 - Math.exp(-this.damping * dt * k);
        // apply this force
        var springForce = this.springForceFunc(this, dist);
        applyImpulses(a, b, this.r1, this.r2, this.n.x * springForce * dt, this.n.y * springForce * dt);
    };
    DampedSpring.prototype.applyCachedImpulse = function (dtCoef) {
        // pass
    };
    DampedSpring.prototype.applyImpulse = function () {
        // compute relative velocity
        var nrv = normalRelativeVelocity(this.a, this.b, this.r1, this.r2, this.n);
        // compute velocity loss from drag
        var vDamped = (this.targetNormalRelativeVelocity -
            nrv) * this.dragCoef;
        this.targetNormalRelativeVelocity = nrv + vDamped;
        vDamped *= this.nMass;
        applyImpulses(this.a, this.b, this.r1, this.r2, this.n.x * vDamped, this.n.y * vDamped);
    };
    DampedSpring.prototype.getImpulse = function () {
        return 0;
    };
    return DampedSpring;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var GearJoint = /** @class */ (function (_super) {
    __extends(GearJoint, _super);
    function GearJoint(a, b, phase, ratio) {
        var _this = _super.call(this, a, b) || this;
        _this.phase = phase;
        _this.ratio = ratio;
        _this.ratioInv = 1 / ratio;
        _this.jAcc = 0;
        _this.iSum = _this.bias = _this.jMax = 0;
        return _this;
    }
    GearJoint.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        // calculate moment of inertia coefficient.
        this.iSum = 1 / (a.inertiaInv * this.ratioInv + this.ratio * b.inertiaInv);
        // calculate bias velocity
        var maxBias = this.maxBias;
        this.bias = clamp((-biasCoef(this.errorBias, dt) *
            (b.a * this.ratio - a.a - this.phase) /
            dt), -maxBias, maxBias);
        // compute max impulse
        this.jMax = this.maxForce * dt;
    };
    GearJoint.prototype.applyCachedImpulse = function (dtCoef) {
        var a = this.a;
        var b = this.b;
        var j = this.jAcc * dtCoef;
        a.w -= j * a.inertiaInv * this.ratioInv;
        b.w += j * b.inertiaInv;
    };
    GearJoint.prototype.applyImpulse = function () {
        var a = this.a;
        var b = this.b;
        // compute relative rotational velocity
        var wr = b.w * this.ratio - a.w;
        // compute normal impulse
        var j = (this.bias - wr) * this.iSum;
        var jOld = this.jAcc;
        this.jAcc = clamp(jOld + j, -this.jMax, this.jMax);
        j = this.jAcc - jOld;
        // apply impulse
        a.w -= j * a.inertiaInv * this.ratioInv;
        b.w += j * b.inertiaInv;
    };
    GearJoint.prototype.getImpulse = function () {
        return Math.abs(this.jAcc);
    };
    GearJoint.prototype.setRatio = function (value) {
        this.ratio = value;
        this.ratioInv = 1 / value;
        this.activateBodies();
    };
    return GearJoint;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var GrooveJoint = /** @class */ (function (_super) {
    __extends(GrooveJoint, _super);
    function GrooveJoint(a, b, grooveA, grooveB, anchr2) {
        var _this = _super.call(this, a, b) || this;
        _this.grooveA = grooveA;
        _this.grooveB = grooveB;
        _this.grooveN = vperp(vnormalize(vsub(grooveB, grooveA)));
        _this.anchr2 = anchr2;
        _this.grooveTN = null;
        _this.clamp = 0;
        _this.r1 = _this.r2 = null;
        _this.k1 = new Vect(0, 0);
        _this.k2 = new Vect(0, 0);
        _this.jAcc = vzero;
        _this.jMaxLen = 0;
        _this.bias = null;
        return _this;
    }
    GrooveJoint.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        // calculate endpoints in worldspace
        var ta = a.local2World(this.grooveA);
        var tb = a.local2World(this.grooveB);
        // calculate axis
        var n = vrotate(this.grooveN, a.rot);
        var d = vdot(ta, n);
        this.grooveTN = n;
        this.r2 = vrotate(this.anchr2, b.rot);
        // calculate tangential distance along the axis of r2
        var td = vcross(vadd(b.p, this.r2), n);
        // calculate clamping factor and r2
        if (td <= vcross(ta, n)) {
            this.clamp = 1;
            this.r1 = vsub(ta, a.p);
        }
        else if (td >= vcross(tb, n)) {
            this.clamp = -1;
            this.r1 = vsub(tb, a.p);
        }
        else {
            this.clamp = 0;
            this.r1 = vsub(vadd(vmult(vperp(n), -td), vmult(n, d)), a.p);
        }
        // Calculate mass tensor
        _a = kTensor(a, b, this.r1, this.r2), this.k1 = _a[0], this.k2 = _a[1];
        // compute max impulse
        this.jMaxLen = this.maxForce * dt;
        // calculate bias velocity
        var delta = vsub(vadd(b.p, this.r2), vadd(a.p, this.r1));
        this.bias = vclamp(vmult(delta, -biasCoef(this.errorBias, dt) / dt), this.maxBias);
        var _a;
    };
    GrooveJoint.prototype.applyCachedImpulse = function (dtCoef) {
        applyImpulses(this.a, this.b, this.r1, this.r2, this.jAcc.x * dtCoef, this.jAcc.y * dtCoef);
    };
    GrooveJoint.prototype.grooveConstrain = function (j) {
        var n = this.grooveTN;
        var jClamp = (this.clamp * vcross(j, n) > 0) ? j : vproject(j, n);
        return vclamp(jClamp, this.jMaxLen);
    };
    GrooveJoint.prototype.applyImpulse = function () {
        var a = this.a;
        var b = this.b;
        var r1 = this.r1;
        var r2 = this.r2;
        // compute impulse
        var vr = relativeVelocity(a, b, r1, r2);
        var j = multK(vsub(this.bias, vr), this.k1, this.k2);
        var jOld = this.jAcc;
        this.jAcc = this.grooveConstrain(vadd(jOld, j));
        // apply impulse
        applyImpulses(a, b, this.r1, this.r2, this.jAcc.x - jOld.x, this.jAcc.y - jOld.y);
    };
    GrooveJoint.prototype.getImpulse = function () {
        return vlength(this.jAcc);
    };
    GrooveJoint.prototype.setGrooveA = function (value) {
        this.grooveA = value;
        this.grooveN = vperp(vnormalize(vsub(this.grooveB, value)));
        this.activateBodies();
    };
    GrooveJoint.prototype.setGrooveB = function (value) {
        this.grooveB = value;
        this.grooveN = vperp(vnormalize(vsub(value, this.grooveA)));
        this.activateBodies();
    };
    return GrooveJoint;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var PinJoint = /** @class */ (function (_super) {
    __extends(PinJoint, _super);
    function PinJoint(a, b, anchr1, anchr2) {
        var _this = _super.call(this, a, b) || this;
        _this.anchr1 = anchr1;
        _this.anchr2 = anchr2;
        // STATIC_BODY_CHECK
        var p1 = (a ? vadd(a.p, vrotate(anchr1, a.rot)) : anchr1);
        var p2 = (b ? vadd(b.p, vrotate(anchr2, b.rot)) : anchr2);
        _this.dist = vlength(vsub(p2, p1));
        assertSoft(_this.dist > 0, "You created a 0 length pin joint. A pivot joint will be much " +
            "more stable.");
        _this.r1 = _this.r2 = null;
        _this.n = null;
        _this.nMass = 0;
        _this.jnAcc = _this.jnMax = 0;
        _this.bias = 0;
        return _this;
    }
    PinJoint.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        this.r1 = vrotate(this.anchr1, a.rot);
        this.r2 = vrotate(this.anchr2, b.rot);
        var delta = vsub(vadd(b.p, this.r2), vadd(a.p, this.r1));
        var dist = vlength(delta);
        this.n = vmult(delta, 1 / (dist ? dist : Infinity));
        // calculate mass normal
        this.nMass = 1 / kScalar(a, b, this.r1, this.r2, this.n);
        // calculate bias velocity
        var maxBias = this.maxBias;
        this.bias = clamp(-biasCoef(this.errorBias, dt) * (dist - this.dist) / dt, -maxBias, maxBias);
        // compute max impulse
        this.jnMax = this.maxForce * dt;
    };
    PinJoint.prototype.applyCachedImpulse = function (dtCoef) {
        var j = vmult(this.n, this.jnAcc * dtCoef);
        applyImpulses(this.a, this.b, this.r1, this.r2, j.x, j.y);
    };
    PinJoint.prototype.applyImpulse = function () {
        var a = this.a;
        var b = this.b;
        var n = this.n;
        // compute relative velocity
        var vrn = normalRelativeVelocity(a, b, this.r1, this.r2, n);
        // compute normal impulse
        var jn = (this.bias - vrn) * this.nMass;
        var jnOld = this.jnAcc;
        this.jnAcc = clamp(jnOld + jn, -this.jnMax, this.jnMax);
        jn = this.jnAcc - jnOld;
        // apply impulse
        applyImpulses(a, b, this.r1, this.r2, n.x * jn, n.y * jn);
    };
    PinJoint.prototype.getImpulse = function () {
        return Math.abs(this.jnAcc);
    };
    return PinJoint;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// Pivot joints can also be created with (a, b, pivot);
var PivotJoint = /** @class */ (function (_super) {
    __extends(PivotJoint, _super);
    function PivotJoint(a, b, anchr1, anchr2) {
        var _this = _super.call(this, a, b) || this;
        if (typeof anchr2 === "undefined") {
            var pivot = anchr1;
            anchr1 = (a ? a.world2Local(pivot) : pivot);
            anchr2 = (b ? b.world2Local(pivot) : pivot);
        }
        _this.anchr1 = anchr1;
        _this.anchr2 = anchr2;
        _this.r1 = _this.r2 = vzero;
        _this.k1 = new Vect(0, 0);
        _this.k2 = new Vect(0, 0);
        _this.jAcc = vzero;
        _this.jMaxLen = 0;
        _this.bias = vzero;
        return _this;
    }
    PivotJoint.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        this.r1 = vrotate(this.anchr1, a.rot);
        this.r2 = vrotate(this.anchr2, b.rot);
        // Calculate mass tensor. Result is stored into this.k1 & this.k2.
        _a = kTensor(a, b, this.r1, this.r2), this.k1 = _a[0], this.k2 = _a[1];
        // compute max impulse
        this.jMaxLen = this.maxForce * dt;
        // calculate bias velocity
        var delta = vsub(vadd(b.p, this.r2), vadd(a.p, this.r1));
        this.bias = vclamp(vmult(delta, -biasCoef(this.errorBias, dt) / dt), this.maxBias);
        var _a;
    };
    PivotJoint.prototype.applyCachedImpulse = function (dtCoef) {
        applyImpulses(this.a, this.b, this.r1, this.r2, this.jAcc.x * dtCoef, this.jAcc.y * dtCoef);
    };
    PivotJoint.prototype.applyImpulse = function () {
        var a = this.a;
        var b = this.b;
        var r1 = this.r1;
        var r2 = this.r2;
        // compute relative velocity
        var vr = relativeVelocity(a, b, r1, r2);
        // compute normal impulse
        var j = multK(vsub(this.bias, vr), this.k1, this.k2);
        var jOld = this.jAcc;
        this.jAcc = vclamp(vadd(this.jAcc, j), this.jMaxLen);
        // apply impulse
        applyImpulses(a, b, this.r1, this.r2, this.jAcc.x - jOld.x, this.jAcc.y - jOld.y);
    };
    PivotJoint.prototype.getImpulse = function () {
        return vlength(this.jAcc);
    };
    return PivotJoint;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var RatchetJoint = /** @class */ (function (_super) {
    __extends(RatchetJoint, _super);
    function RatchetJoint(a, b, phase, ratchet) {
        var _this = _super.call(this, a, b) || this;
        _this.phase = phase;
        _this.ratchet = ratchet;
        // STATIC_BODY_CHECK
        _this.angle = (b ? b.a : 0) - (a ? a.a : 0);
        _this.iSum = _this.bias = _this.jAcc = _this.jMax = 0;
        return _this;
    }
    RatchetJoint.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        var angle = this.angle;
        var phase = this.phase;
        var ratchet = this.ratchet;
        var delta = b.a - a.a;
        var diff = angle - delta;
        var pdist = 0;
        if (diff * ratchet > 0) {
            pdist = diff;
        }
        else {
            this.angle = Math.floor((delta - phase) / ratchet) * ratchet + phase;
        }
        // calculate moment of inertia coefficient.
        this.iSum = 1 / (a.inertiaInv + b.inertiaInv);
        // calculate bias velocity
        var maxBias = this.maxBias;
        this.bias = clamp(-biasCoef(this.errorBias, dt) * pdist / dt, -maxBias, maxBias);
        // compute max impulse
        this.jMax = this.maxForce * dt;
        // If the bias is 0, the joint is not at a limit. Reset the impulse.
        if (!this.bias) {
            this.jAcc = 0;
        }
    };
    RatchetJoint.prototype.applyCachedImpulse = function (dtCoef) {
        var a = this.a;
        var b = this.b;
        var j = this.jAcc * dtCoef;
        a.w -= j * a.inertiaInv;
        b.w += j * b.inertiaInv;
    };
    RatchetJoint.prototype.applyImpulse = function () {
        if (!this.bias) {
            return; // early exit
        }
        var a = this.a;
        var b = this.b;
        // compute relative rotational velocity
        var wr = b.w - a.w;
        var ratchet = this.ratchet;
        // compute normal impulse
        var j = -(this.bias + wr) * this.iSum;
        var jOld = this.jAcc;
        this.jAcc = clamp((jOld + j) * ratchet, 0, this.jMax * Math.abs(ratchet)) / ratchet;
        j = this.jAcc - jOld;
        // apply impulse
        a.w -= j * a.inertiaInv;
        b.w += j * b.inertiaInv;
    };
    RatchetJoint.prototype.getImpulse = function () {
        return Math.abs(this.jAcc);
    };
    return RatchetJoint;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var RotaryLimitJoint = /** @class */ (function (_super) {
    __extends(RotaryLimitJoint, _super);
    function RotaryLimitJoint(a, b, min, max) {
        var _this = _super.call(this, a, b) || this;
        _this.min = min;
        _this.max = max;
        _this.jAcc = 0;
        _this.iSum = _this.bias = _this.jMax = 0;
        return _this;
    }
    RotaryLimitJoint.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        var dist = b.a - a.a;
        var pdist = 0;
        if (dist > this.max) {
            pdist = this.max - dist;
        }
        else if (dist < this.min) {
            pdist = this.min - dist;
        }
        // calculate moment of inertia coefficient.
        this.iSum = 1 / (1 / a.inertia + 1 / b.inertia);
        // calculate bias velocity
        var maxBias = this.maxBias;
        this.bias = clamp(-biasCoef(this.errorBias, dt) * pdist / dt, -maxBias, maxBias);
        // compute max impulse
        this.jMax = this.maxForce * dt;
        // If the bias is 0, the joint is not at a limit. Reset the impulse.
        if (!this.bias) {
            this.jAcc = 0;
        }
    };
    RotaryLimitJoint.prototype.applyCachedImpulse = function (dtCoef) {
        var a = this.a;
        var b = this.b;
        var j = this.jAcc * dtCoef;
        a.w -= j * a.inertiaInv;
        b.w += j * b.inertiaInv;
    };
    RotaryLimitJoint.prototype.applyImpulse = function () {
        if (!this.bias) {
            return; // early exit
        }
        var a = this.a;
        var b = this.b;
        // compute relative rotational velocity
        var wr = b.w - a.w;
        // compute normal impulse
        var j = -(this.bias + wr) * this.iSum;
        var jOld = this.jAcc;
        if (this.bias < 0) {
            this.jAcc = clamp(jOld + j, 0, this.jMax);
        }
        else {
            this.jAcc = clamp(jOld + j, -this.jMax, 0);
        }
        j = this.jAcc - jOld;
        // apply impulse
        a.w -= j * a.inertiaInv;
        b.w += j * b.inertiaInv;
    };
    RotaryLimitJoint.prototype.getImpulse = function () {
        return Math.abs(this.jAcc);
    };
    return RotaryLimitJoint;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var SimpleMotor = /** @class */ (function (_super) {
    __extends(SimpleMotor, _super);
    function SimpleMotor(a, b, rate) {
        var _this = _super.call(this, a, b) || this;
        _this.rate = rate;
        _this.jAcc = 0;
        _this.iSum = _this.jMax = 0;
        return _this;
    }
    SimpleMotor.prototype.preStep = function (dt) {
        // calculate moment of inertia coefficient.
        this.iSum = 1 / (this.a.inertiaInv + this.b.inertiaInv);
        // compute max impulse
        this.jMax = this.maxForce * dt;
    };
    SimpleMotor.prototype.applyCachedImpulse = function (dtCoef) {
        var a = this.a;
        var b = this.b;
        var j = this.jAcc * dtCoef;
        a.w -= j * a.inertiaInv;
        b.w += j * b.inertiaInv;
    };
    SimpleMotor.prototype.applyImpulse = function () {
        var a = this.a;
        var b = this.b;
        // compute relative rotational velocity
        var wr = b.w - a.w + this.rate;
        // compute normal impulse
        var j = -wr * this.iSum;
        var jOld = this.jAcc;
        this.jAcc = clamp(jOld + j, -this.jMax, this.jMax);
        j = this.jAcc - jOld;
        // apply impulse
        a.w -= j * a.inertiaInv;
        b.w += j * b.inertiaInv;
    };
    SimpleMotor.prototype.getImpulse = function () {
        return Math.abs(this.jAcc);
    };
    return SimpleMotor;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var SlideJoint = /** @class */ (function (_super) {
    __extends(SlideJoint, _super);
    function SlideJoint(a, b, anchr1, anchr2, min, max) {
        var _this = _super.call(this, a, b) || this;
        _this.anchr1 = anchr1;
        _this.anchr2 = anchr2;
        _this.min = min;
        _this.max = max;
        _this.r1 = _this.r2 = _this.n = null;
        _this.nMass = 0;
        _this.jnAcc = _this.jnMax = 0;
        _this.bias = 0;
        return _this;
    }
    SlideJoint.prototype.preStep = function (dt) {
        var a = this.a;
        var b = this.b;
        this.r1 = vrotate(this.anchr1, a.rot);
        this.r2 = vrotate(this.anchr2, b.rot);
        var delta = vsub(vadd(b.p, this.r2), vadd(a.p, this.r1));
        var dist = vlength(delta);
        var pdist = 0;
        if (dist > this.max) {
            pdist = dist - this.max;
            this.n = vnormalize_safe(delta);
        }
        else if (dist < this.min) {
            pdist = this.min - dist;
            this.n = vneg(vnormalize_safe(delta));
        }
        else {
            this.n = vzero;
            this.jnAcc = 0;
        }
        // calculate mass normal
        this.nMass = 1 / kScalar(a, b, this.r1, this.r2, this.n);
        // calculate bias velocity
        var maxBias = this.maxBias;
        this.bias = clamp(-biasCoef(this.errorBias, dt) * pdist / dt, -maxBias, maxBias);
        // compute max impulse
        this.jnMax = this.maxForce * dt;
    };
    SlideJoint.prototype.applyCachedImpulse = function (dtCoef) {
        var jn = this.jnAcc * dtCoef;
        applyImpulses(this.a, this.b, this.r1, this.r2, this.n.x * jn, this.n.y * jn);
    };
    SlideJoint.prototype.applyImpulse = function () {
        if (this.n.x === 0 && this.n.y === 0) {
            return; // early exit
        }
        var a = this.a;
        var b = this.b;
        var n = this.n;
        var r1 = this.r1;
        var r2 = this.r2;
        // compute relative velocity
        var vr = relativeVelocity(a, b, r1, r2);
        var vrn = vdot(vr, n);
        // compute normal impulse
        var jn = (this.bias - vrn) * this.nMass;
        var jnOld = this.jnAcc;
        this.jnAcc = clamp(jnOld + jn, -this.jnMax, 0);
        jn = this.jnAcc - jnOld;
        // apply impulse
        applyImpulses(a, b, this.r1, this.r2, n.x * jn, n.y * jn);
    };
    SlideJoint.prototype.getImpulse = function () {
        return Math.abs(this.jnAcc);
    };
    return SlideJoint;
}(Constraint));

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* Copyright (c) 2017 Ben Mather
 * Forked from Chipmunk JS, copyright (c) 2013 Seph Gentle
 * Ported from Chipmunk, copyright (c) 2010 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var defaultCollisionHandler = new CollisionHandler();
function assertSpaceUnlocked(space) {
    assert(!space.locked, "This addition/removal cannot be done safely during a call to " +
        "cpSpaceStep() or during a query. Put these calls into a post-step" +
        "callback.");
}
// **** All Important cpSpaceStep() Function
function updateFunc(shape) {
    var body = shape.body;
    shape.update(body.p, body.rot);
}
/// Basic Unit of Simulation in Chipmunk
var Space = /** @class */ (function () {
    function Space() {
        this.stamp = 0;
        this.dtCurr = 0;
        this.bodies = [];
        this.rousedBodies = [];
        // TODO
        this.sleepingComponents = [];
        this.spatialIndex = new BBTreeIndex();
        this.arbiters = [];
        this.cachedArbiters = new Map();
        this.constraints = [];
        this.locked = 0;
        this.collisionHandlers = new Map();
        this.defaultHandler = defaultCollisionHandler;
        this.postStepCallbacks = [];
        /// Number of iterations to use in the impulse solver to solve contacts.
        this.iterations = 10;
        /// Gravity to pass to rigid bodies when integrating velocity.
        this.gravity = vzero;
        /// Damping rate expressed as the fraction of velocity bodies retain each
        /// second.  A value of 0.9 would mean that each body's velocity will drop
        /// 10% per second.  The default value is 1.0, meaning no damping is
        /// applied.
        /// @note This damping value is different than those of cpDampedSpring and
        /// cpDampedRotarySpring.
        this.damping = 1;
        /// Speed threshold for a body to be considered idle.
        /// The default value of 0 means to let the space guess a good threshold
        /// based on gravity.
        this.idleSpeedThreshold = 0;
        /// Time a group of bodies must remain idle in order to fall asleep.
        /// Enabling sleeping also implicitly enables the the contact graph.
        /// The default value of Infinity disables the sleeping algorithm.
        this.sleepTimeThreshold = Infinity;
        /// Amount of encouraged penetration between colliding shapes..
        /// Used to reduce oscillating contacts and keep the collision cache warm.
        /// Defaults to 0.1. If you have poor simulation quality,
        /// increase this number as much as possible without allowing visible
        /// amounts of overlap.
        this.collisionSlop = 0.1;
        /// Determines how fast overlapping shapes are pushed apart.
        /// Expressed as a fraction of the error remaining after each second.
        /// Defaults to pow(1.0 - 0.1, 60.0) meaning that Chipmunk fixes 10% of
        /// overlap each frame at 60Hz.
        this.collisionBias = Math.pow((1 - 0.1), 60);
        /// Number of frames that contact information should persist.
        /// Defaults to 3. There is probably never a reason to change this value.
        this.collisionPersistence = 3;
        /// Rebuild the contact graph during each step. Must be enabled to use the
        /// cpBodyEachArbiter() function.  Disabled by default for a small
        /// performance boost. Enabled implicitly when the sleeping feature is
        /// enabled.
        this.enableContactGraph = false;
        /// The designated static body for this space.
        /// You can modify this body, or replace it with your own static body.
        /// By default it points to a statically allocated cpBody in the cpSpace
        /// struct.
        this.staticBody = new Body(Infinity, Infinity);
        // Cache the collideShapes callback function for the space.
        // TODO
        this.collideShapes = this.makeCollideShapes();
        // Pass.
    }
    Space.prototype.getCurrentTimeStep = function () {
        return this.dtCurr;
    };
    Space.prototype.setIterations = function (iter) {
        this.iterations = iter;
    };
    /// returns true from inside a callback and objects cannot be added/removed.
    Space.prototype.isLocked = function () {
        return !!this.locked;
    };
    // **** Collision handler function management
    /// Set a collision handler to be used whenever the two shapes with the
    /// given collision types collide.  You can pass null for any function you
    /// don't want to implement.
    Space.prototype.addCollisionHandler = function (a, b, begin, preSolve, postSolve, separate) {
        assertSpaceUnlocked(this);
        // Remove any old function so the new one will get added.
        this.removeCollisionHandler(a, b);
        var handler = new CollisionHandler();
        handler.a = a;
        handler.b = b;
        if (begin) {
            handler.begin = begin;
        }
        if (preSolve) {
            handler.preSolve = preSolve;
        }
        if (postSolve) {
            handler.postSolve = postSolve;
        }
        if (separate) {
            handler.separate = separate;
        }
        this.collisionHandlers.set(hashPair(a, b), handler);
    };
    /// Unset a collision handler.
    Space.prototype.removeCollisionHandler = function (a, b) {
        assertSpaceUnlocked(this);
        this.collisionHandlers.delete(hashPair(a, b));
    };
    /// Set a default collision handler for this space.
    /// The default collision handler is invoked for each colliding pair of
    /// shapes that isn't explicitly handled by a specific collision handler.
    /// You can pass null for any function you don't want to implement.
    Space.prototype.setDefaultCollisionHandler = function (begin, preSolve, postSolve, separate) {
        assertSpaceUnlocked(this);
        var handler = new CollisionHandler();
        if (begin) {
            handler.begin = begin;
        }
        if (preSolve) {
            handler.preSolve = preSolve;
        }
        if (postSolve) {
            handler.postSolve = postSolve;
        }
        if (separate) {
            handler.separate = separate;
        }
        this.defaultHandler = handler;
    };
    Space.prototype.lookupHandler = function (a, b) {
        return (this.collisionHandlers.get(hashPair(a, b)) || this.defaultHandler);
    };
    // **** Body, Shape, and Joint Management
    /// Add a collision shape to the simulation.
    /// If the shape is attached to a static body, it will be added as a static
    /// shape.
    Space.prototype.addShape = function (shape) {
        var body = shape.body;
        if (body.isStatic()) {
            return this.addStaticShape(shape);
        }
        assert(!shape.space, "This shape is already added to a space and cannot be added to " +
            "another.");
        assertSpaceUnlocked(this);
        body.activate();
        body.addShape(shape);
        shape.update(body.p, body.rot);
        this.spatialIndex.insert(shape);
        shape.space = this;
        return shape;
    };
    /// Explicity add a shape as a static shape to the simulation.
    Space.prototype.addStaticShape = function (shape) {
        assert(!shape.space, "This shape is already added to a space and cannot be added to " +
            "another.");
        assertSpaceUnlocked(this);
        var body = shape.body;
        body.addShape(shape);
        shape.update(body.p, body.rot);
        this.spatialIndex.insertStatic(shape);
        shape.space = this;
        return shape;
    };
    /// Add a rigid body to the simulation.
    Space.prototype.addBody = function (body) {
        assert(!body.isStatic(), "Static bodies cannot be added to a space as they are not meant " +
            "to be simulated.");
        assert(!body.space, "This body is already added to a space and cannot be added to " +
            "another.");
        assertSpaceUnlocked(this);
        this.bodies.push(body);
        body.space = this;
        return body;
    };
    /// Add a constraint to the simulation.
    Space.prototype.addConstraint = function (constraint) {
        assert(!constraint.space, "This body is already added to a space and cannot be added to " +
            "another.");
        assertSpaceUnlocked(this);
        var a = constraint.a;
        var b = constraint.b;
        a.activate();
        b.activate();
        this.constraints.push(constraint);
        // Push onto the heads of the bodies' constraint lists
        constraint.nextA = a.constraintList;
        a.constraintList = constraint;
        constraint.nextB = b.constraintList;
        b.constraintList = constraint;
        constraint.space = this;
        return constraint;
    };
    Space.prototype.filterArbiters = function (body, filter) {
        var _this = this;
        this.cachedArbiters.forEach(function (arb, hash) {
            // Match on the filter shape, or if it's null the filter body
            if ((body === arb.bodyA &&
                (filter === arb.shapeA || filter === null)) || (body === arb.bodyB &&
                (filter === arb.shapeB || filter === null))) {
                // Call separate when removing shapes.
                if (filter && arb.state !== "cached") {
                    arb.callSeparate(_this);
                }
                arb.unthread();
                deleteObjFromList(_this.arbiters, arb);
                // this.pooledArbiters.push(arb);
                _this.cachedArbiters.delete(hash);
            }
        });
    };
    /// Remove a collision shape from the simulation.
    Space.prototype.removeShape = function (shape) {
        var body = shape.body;
        if (body.isStatic()) {
            this.removeStaticShape(shape);
        }
        else {
            assert(this.containsShape(shape), "Cannot remove a shape that was not added to the space. " +
                "(Removed twice maybe?)");
            assertSpaceUnlocked(this);
            body.activate();
            body.removeShape(shape);
            this.filterArbiters(body, shape);
            this.spatialIndex.remove(shape);
            shape.space = null;
        }
    };
    /// Remove a collision shape added using addStaticShape() from the
    /// simulation.
    Space.prototype.removeStaticShape = function (shape) {
        assert(this.containsShape(shape), "Cannot remove a static or sleeping shape that was not added to " +
            "the space. (Removed twice maybe?)");
        assertSpaceUnlocked(this);
        var body = shape.body;
        if (body.isStatic()) {
            body.activateStatic(shape);
        }
        body.removeShape(shape);
        this.filterArbiters(body, shape);
        this.spatialIndex.remove(shape);
        shape.space = null;
    };
    /// Remove a rigid body from the simulation.
    Space.prototype.removeBody = function (body) {
        assert(this.containsBody(body), "Cannot remove a body that was not added to the space. " +
            "(Removed twice maybe?)");
        assertSpaceUnlocked(this);
        body.activate();
        // this.filterArbiters(body, null);
        deleteObjFromList(this.bodies, body);
        body.space = null;
    };
    /// Remove a constraint from the simulation.
    Space.prototype.removeConstraint = function (constraint) {
        assert(this.containsConstraint(constraint), "Cannot remove a constraint that was not added to the space. " +
            "(Removed twice maybe?)");
        assertSpaceUnlocked(this);
        constraint.a.activate();
        constraint.b.activate();
        deleteObjFromList(this.constraints, constraint);
        constraint.a.removeConstraint(constraint);
        constraint.b.removeConstraint(constraint);
        constraint.space = null;
    };
    /// Test if a collision shape has been added to the space.
    Space.prototype.containsShape = function (shape) {
        return shape.space === this;
    };
    /// Test if a rigid body has been added to the space.
    Space.prototype.containsBody = function (body) {
        return body.space === this;
    };
    /// Test if a constraint has been added to the space.
    Space.prototype.containsConstraint = function (constraint) {
        return constraint.space === this;
    };
    Space.prototype.uncacheArbiter = function (arb) {
        this.cachedArbiters.delete(hashPair(arb.shapeA.hashid, arb.shapeB.hashid));
        deleteObjFromList(this.arbiters, arb);
    };
    // **** Iteration
    /// Call @c func for each body in the space.
    Space.prototype.eachBody = function (func) {
        this.lock();
        {
            var bodies = this.bodies;
            for (var _i = 0, _a = this.bodies; _i < _a.length; _i++) {
                var body = _a[_i];
                func(body);
            }
            for (var _b = 0, _c = this.sleepingComponents; _b < _c.length; _b++) {
                var root = _c[_b];
                var body = root;
                while (body) {
                    var next = body.nodeNext;
                    func(body);
                    body = next;
                }
            }
        }
        this.unlock(true);
    };
    /// Call @c func for each shape in the space.
    Space.prototype.eachShape = function (func) {
        this.lock();
        {
            this.spatialIndex.each(func);
        }
        this.unlock(true);
    };
    /// Call @c func for each shape in the space.
    Space.prototype.eachConstraint = function (func) {
        this.lock();
        {
            for (var _i = 0, _a = this.constraints; _i < _a.length; _i++) {
                var constraint = _a[_i];
                func(constraint);
            }
        }
        this.unlock(true);
    };
    // **** Spatial Index Management
    /// Update the collision detection info for the static shapes in the space.
    Space.prototype.reindexStatic = function () {
        assert(!this.locked, "You cannot manually reindex objects while the space is locked. " +
            "Wait until the current query or step is complete.");
        // TODO this should only update static shapes.
        this.spatialIndex.each(function (shape) {
            var body = shape.body;
            shape.update(body.p, body.rot);
        });
        this.spatialIndex.reindexStatic();
    };
    /// Update the collision detection data for a specific shape in the space.
    Space.prototype.reindexShape = function (shape) {
        assert(!this.locked, "You cannot manually reindex objects while the space is locked. " +
            "Wait until the current query or step is complete.");
        var body = shape.body;
        shape.update(body.p, body.rot);
        // attempt to rehash the shape in both hashes
        this.spatialIndex.reindexShape(shape);
    };
    /// Update the collision detection data for all shapes attached to a body.
    Space.prototype.reindexShapesForBody = function (body) {
        var _this = this;
        body.eachShape(function (shape) {
            _this.reindexShape(shape);
        });
    };
    Space.prototype.activateBody = function (body) {
        var _this = this;
        assert(!body.isRogue(), "Internal error: Attempting to activate a rogue body.");
        if (this.locked) {
            // cpSpaceActivateBody() is called again once the space is unlocked
            if (this.rousedBodies.indexOf(body) === -1) {
                this.rousedBodies.push(body);
            }
        }
        else {
            this.bodies.push(body);
            body.eachShape(function (shape) {
                _this.spatialIndex.remove(shape);
                _this.spatialIndex.insert(shape);
            });
            body.eachArbiter(function (arbiter) {
                if (body === arbiter.bodyA || arbiter.bodyA.isStatic()) {
                    // var contacts = arb.contacts;
                    // Restore contact values back to the space's contact buffer
                    // memory
                    // arb.contacts = cpContactBufferGetArray(this);
                    // memcpy(
                    //     arb.contacts, contacts,
                    //     numContacts*sizeof(cpContact)
                    // );
                    // cpSpacePushContacts(this, numContacts);
                    // Reinsert the arbiter into the arbiter cache
                    _this.cachedArbiters.set(hashPair(arbiter.shapeA.hashid, arbiter.shapeB.hashid), arbiter);
                    // Update the arbiter's state
                    arbiter.stamp = _this.stamp;
                    arbiter.handler = _this.lookupHandler(arbiter.shapeA.collisionType, arbiter.shapeB.collisionType);
                    _this.arbiters.push(arbiter);
                }
            });
            body.eachConstraint(function (constraint) {
                if (body === constraint.a || constraint.a.isStatic()) {
                    _this.constraints.push(constraint);
                }
            });
        }
    };
    Space.prototype.deactivateBody = function (body) {
        var _this = this;
        assert(!body.isRogue(), "Internal error: Attempting to deactivate a rogue body.");
        deleteObjFromList(this.bodies, body);
        body.eachShape(function (shape) {
            _this.spatialIndex.remove(shape);
            _this.spatialIndex.insertStatic(shape);
        });
        body.eachArbiter(function (arbiter) {
            if (body === arbiter.bodyA || arbiter.bodyA.isStatic()) {
                _this.uncacheArbiter(arbiter);
                // Save contact values to a new block of memory so they won't
                // time out
                // size_t bytes = arb.numContacts*sizeof(cpContact);
                // cpContact *contacts = (cpContact *)cpcalloc(1, bytes);
                // memcpy(contacts, arb.contacts, bytes);
                // arb.contacts = contacts;
            }
        });
        body.eachConstraint(function (constraint) {
            if (body === constraint.a || constraint.a.isStatic()) {
                deleteObjFromList(_this.constraints, constraint);
            }
        });
    };
    Space.prototype.processComponents = function (dt) {
        var sleep = (this.sleepTimeThreshold !== Infinity);
        var bodies = this.bodies;
        // These checks can be removed at some stage (if DEBUG == undefined)
        for (var _i = 0, bodies_1 = bodies; _i < bodies_1.length; _i++) {
            var body = bodies_1[_i];
            assertSoft(body.nodeNext === null, "Internal Error: " +
                "Dangling next pointer detected in contact graph.");
            assertSoft(body.nodeRoot === null, "Internal Error: " +
                "Dangling root pointer detected in contact graph.");
        }
        // Calculate the kinetic energy of all the bodies
        if (sleep) {
            var dv = this.idleSpeedThreshold;
            var dvsq = (dv ? dv * dv : vlengthsq(this.gravity) * dt * dt);
            for (var _a = 0, bodies_2 = bodies; _a < bodies_2.length; _a++) {
                var body = bodies_2[_a];
                // Need to deal with infinite mass objects
                var keThreshold = (dvsq ? body.mass * dvsq : 0);
                body.nodeIdleTime = (body.kineticEnergy() > keThreshold
                    ? 0
                    : body.nodeIdleTime + dt);
            }
        }
        // Awaken any sleeping bodies found and then push arbiters to the
        // bodies' lists.
        for (var _b = 0, _c = this.arbiters; _b < _c.length; _b++) {
            var arb = _c[_b];
            var a = arb.bodyA;
            var b = arb.bodyB;
            if (sleep) {
                if ((b.isRogue() && !b.isStatic()) || a.isSleeping()) {
                    a.activate();
                }
                if ((a.isRogue() && !a.isStatic()) || b.isSleeping()) {
                    b.activate();
                }
            }
            a.pushArbiter(arb);
            b.pushArbiter(arb);
        }
        if (sleep) {
            // Bodies should be held active if connected by a joint to a
            // non-static rouge body.
            for (var _d = 0, _e = this.constraints; _d < _e.length; _d++) {
                var constraint = _e[_d];
                var bodyA = constraint.a;
                var bodyB = constraint.b;
                if (bodyB.isRogue() && !bodyB.isStatic()) {
                    bodyA.activate();
                }
                if (bodyA.isRogue() && !bodyA.isStatic()) {
                    bodyB.activate();
                }
            }
            // Generate components and deactivate sleeping ones
            for (var i = 0; i < bodies.length;) {
                var body = bodies[i];
                if (componentRoot(body) === null) {
                    // Body not in a component yet. Perform a DFS to flood fill
                    // mark the component in the contact graph using this body
                    // as the root.
                    floodFillComponent(body, body);
                    // Check if the component should be put to sleep.
                    if (!componentActive(body, this.sleepTimeThreshold)) {
                        this.sleepingComponents.push(body);
                        for (var other = body; other; other = other.nodeNext) {
                            this.deactivateBody(other);
                        }
                        // deactivateBody() removed the current body from the
                        // list.  Skip incrementing the index counter.
                        continue;
                    }
                }
                i++;
                // Only sleeping bodies retain their component node pointers.
                body.nodeRoot = null;
                body.nodeNext = null;
            }
        }
    };
    Space.prototype.activateShapesTouchingShape = function (shape) {
        if (this.sleepTimeThreshold !== Infinity) {
            this.shapeQuery(shape, function (touching, points) {
                touching.body.activate();
            });
        }
    };
    Space.prototype.pointQuery = function (point, layers, group, func) {
        var helper = function (shape) {
            if (!(shape.group && group === shape.group) &&
                (layers & shape.layers) &&
                shape.pointQuery(point)) {
                func(shape);
            }
        };
        var bb$$1 = new BB(point.x, point.y, point.x, point.y);
        this.lock();
        {
            this.spatialIndex.query(bb$$1, helper);
        }
        this.unlock(true);
    };
    /// Query the space at a point and return the first shape found. Returns
    /// null if no shapes were found.
    Space.prototype.pointQueryFirst = function (point, layers, group) {
        var outShape = null;
        this.pointQuery(point, layers, group, function (shape) {
            if (!shape.sensor) {
                outShape = shape;
            }
        });
        return outShape;
    };
    // Nearest point query functions
    Space.prototype.nearestPointQuery = function (point, maxDistance, layers, group, func) {
        var helper = function (shape) {
            if (!(shape.group && group === shape.group) &&
                (layers & shape.layers)) {
                var info = shape.nearestPointQuery(point);
                if (info.d < maxDistance) {
                    func(shape, info.d, info.p);
                }
            }
        };
        var bb$$1 = bbNewForCircle(point, maxDistance);
        this.lock();
        {
            this.spatialIndex.query(bb$$1, helper);
        }
        this.unlock(true);
    };
    // Unlike the version in chipmunk, this returns a NearestPointQueryInfo
    // object. Use its .shape property to get the actual shape.
    Space.prototype.nearestPointQueryNearest = function (point, maxDistance, layers, group) {
        var out = null;
        var helper = function (shape) {
            if (!(shape.group && group === shape.group) &&
                (layers & shape.layers) &&
                !shape.sensor) {
                var info = shape.nearestPointQuery(point);
                if (info.d < maxDistance && (!out || info.d < out.d)) {
                    out = info;
                }
            }
        };
        var bb$$1 = bbNewForCircle(point, maxDistance);
        this.spatialIndex.query(bb$$1, helper);
        return out;
    };
    /// Perform a directed line segment query (like a raycast) against the space
    /// calling @c func for each shape intersected.
    Space.prototype.segmentQuery = function (start, end, layers, group, func) {
        var helper = function (shape) {
            if (!(shape.group && group === shape.group) &&
                (layers & shape.layers)) {
                var info = shape.segmentQuery(start, end);
                if (info) {
                    func(shape, info.t, info.n);
                }
            }
            return 1;
        };
        this.lock();
        {
            this.spatialIndex.segmentQuery(start, end, 1, helper);
        }
        this.unlock(true);
    };
    /// Perform a directed line segment query (like a raycast) against the space
    /// and return the first shape hit. Returns null if no shapes were hit.
    Space.prototype.segmentQueryFirst = function (start, end, layers, group) {
        var out = null;
        var helper = function (shape) {
            if (!(shape.group && group === shape.group) &&
                (layers & shape.layers) &&
                !shape.sensor) {
                var info = shape.segmentQuery(start, end);
                if (info && (out === null || info.t < out.t)) {
                    out = info;
                }
            }
            return out ? out.t : 1;
        };
        this.spatialIndex.segmentQuery(start, end, 1, helper);
        return out;
    };
    /// Perform a fast rectangle query on the space calling @c func for each
    /// shape found.  Only the shape's bounding boxes are checked for overlap,
    /// not their full shape.
    Space.prototype.bbQuery = function (bb$$1, layers, group, func) {
        var helper = function (shape) {
            if (!(shape.group && group === shape.group) &&
                (layers & shape.layers) &&
                bbIntersects2(bb$$1, shape.bbL, shape.bbB, shape.bbR, shape.bbT)) {
                func(shape);
            }
        };
        this.lock();
        {
            this.spatialIndex.query(bb$$1, helper);
        }
        this.unlock(true);
    };
    /// Query a space for any shapes overlapping the given shape and call
    /// func for each shape found.
    Space.prototype.shapeQuery = function (shape, func) {
        var body = shape.body;
        // var bb = (body ? shape.update(body.p, body.rot) : shape.bb);
        if (body) {
            shape.update(body.p, body.rot);
        }
        var bb$$1 = new BB(shape.bbL, shape.bbB, shape.bbR, shape.bbT);
        // shapeQueryContext context = {func, data, false};
        var anyCollision = false;
        var helper = function (b) {
            var a = shape;
            // Reject any of the simple cases
            if ((a.group && a.group === b.group) ||
                !(a.layers & b.layers) ||
                a === b) {
                return;
            }
            var contacts;
            // Shape 'a' should have the lower shape type. (required by
            // collideShapes() )
            if (a.collisionCode <= b.collisionCode) {
                contacts = collideShapes(a, b);
            }
            else {
                contacts = collideShapes(b, a);
                for (var _i = 0, contacts_1 = contacts; _i < contacts_1.length; _i++) {
                    var contact = contacts_1[_i];
                    contact.n = vneg(contact.n);
                }
            }
            if (contacts.length) {
                anyCollision = !(a.sensor || b.sensor);
                if (func) {
                    var set = new Array(contacts.length);
                    for (var i = 0; i < contacts.length; i++) {
                        set[i] = new ContactPoint(contacts[i].p, contacts[i].n, contacts[i].dist);
                    }
                    func(b, set);
                }
            }
        };
        this.lock();
        {
            this.spatialIndex.query(bb$$1, helper);
        }
        this.unlock(true);
        return anyCollision;
    };
    /// Schedule a post-step callback to be called when cpSpaceStep() finishes.
    Space.prototype.addPostStepCallback = function (func) {
        assertSoft(this.locked, "Adding a post-step callback when the space is not locked is " +
            "unnecessary.  Post-step callbacks will not called until the end " +
            "of the next call to cpSpaceStep() or the next query.");
        this.postStepCallbacks.push(func);
    };
    Space.prototype.runPostStepCallbacks = function () {
        // Don't cache length because post step callbacks may add more post step
        // callbacks directly or indirectly.
        for (var _i = 0, _a = this.postStepCallbacks; _i < _a.length; _i++) {
            var callback = _a[_i];
            callback();
        }
        this.postStepCallbacks = [];
    };
    // **** Locking Functions
    Space.prototype.lock = function () {
        this.locked++;
    };
    Space.prototype.unlock = function (runPostStep) {
        this.locked--;
        assert(this.locked >= 0, "Internal Error: Space lock underflow.");
        if (this.locked === 0 && runPostStep) {
            for (var _i = 0, _a = this.rousedBodies; _i < _a.length; _i++) {
                var body = _a[_i];
                this.activateBody(body);
            }
            this.rousedBodies.length = 0;
            this.runPostStepCallbacks();
        }
    };
    // Callback from the spatial hash.
    Space.prototype.makeCollideShapes = function () {
        var _this = this;
        // It would be nicer to use .bind() or something, but this is faster.
        return function (a, b) {
            // Reject any of the simple cases
            if (
            // BBoxes must overlap
            // !bbIntersects(a.bb, b.bb)
            !(a.bbL <= b.bbR &&
                b.bbL <= a.bbR &&
                a.bbB <= b.bbT &&
                b.bbB <= a.bbT) ||
                // Don't collide shapes attached to the same body.
                a.body === b.body ||
                // Don't collide objects in the same non-zero group
                (a.group && a.group === b.group) ||
                // Don't collide objects that don't share at least on layer.
                !(a.layers & b.layers)) {
                return;
            }
            var handler = _this.lookupHandler(a.collisionType, b.collisionType);
            var sensor = a.sensor || b.sensor;
            if (sensor && handler === defaultCollisionHandler) {
                return;
            }
            // Shape 'a' should have the lower shape type. (required by
            // cpCollideShapes() )
            if (a.collisionCode > b.collisionCode) {
                var temp = a;
                a = b;
                b = temp;
            }
            // Narrow-phase collision detection.
            // cpContact *contacts = cpContactBufferGetArray(space);
            // int numContacts = cpCollideShapes(a, b, contacts);
            var contacts = collideShapes(a, b);
            if (contacts.length === 0) {
                // Shapes are not colliding.
                return;
            }
            // cpSpacePushContacts(space, numContacts);
            // Get an arbiter from space.arbiterSet for the two shapes.
            // This is where the persistant contact magic comes from.
            var arbHash = hashPair(a.hashid, b.hashid);
            var arb = _this.cachedArbiters.get(arbHash);
            if (!arb) {
                arb = new Arbiter(a, b);
                _this.cachedArbiters.set(arbHash, arb);
            }
            arb.update(contacts, handler, a, b);
            // Call the begin function first if it's the first step
            if (arb.state === "first-coll" && !handler.begin(arb, _this)) {
                // permanently ignore the collision until separation
                arb.ignore();
            }
            if (
            // Ignore the arbiter if it has been flagged
            (arb.state !== "ignore") &&
                // Call preSolve
                handler.preSolve(arb, _this) &&
                // Process, but don't add collisions for sensors.
                !sensor) {
                _this.arbiters.push(arb);
            }
            else {
                // cpSpacePopContacts(space, numContacts);
                arb.contacts = null;
                // Normally arbiters are set as used after calling the
                // post-solve callback.  However, post-solve callbacks are not
                // called for sensors or arbiters rejected from pre-solve.
                if (arb.state !== "ignore") {
                    arb.state = "normal";
                }
            }
            // Time stamp the arbiter so we know it was used recently.
            arb.stamp = _this.stamp;
        };
    };
    // Hashset filter func to throw away old arbiters.
    Space.prototype.arbiterSetFilter = function (arb) {
        var ticks = this.stamp - arb.stamp;
        var a = arb.bodyA;
        var b = arb.bodyB;
        // TODO should make an arbiter state for this so it doesn't require
        // filtering arbiters for dangling body pointers on body removal.
        // Preserve arbiters on sensors and rejected arbiters for sleeping
        // objects.  This prevents errant separate callbacks from happenening.
        if ((a.isStatic() || a.isSleeping()) &&
            (b.isStatic() || b.isSleeping())) {
            return true;
        }
        // Arbiter was used last frame, but not this one
        if (ticks >= 1 && arb.state !== "cached") {
            arb.callSeparate(this);
            arb.state = "cached";
        }
        if (ticks >= this.collisionPersistence) {
            arb.contacts = null;
            // cpArrayPush(this.pooledArbiters, arb);
            return false;
        }
        return true;
    };
    /// Step the space forward in time by dt.
    Space.prototype.step = function (dt) {
        // don't step if the timestep is 0!
        if (dt === 0) {
            return;
        }
        assert(vzero.x === 0 && vzero.y === 0, "vzero is invalid");
        this.stamp++;
        var dtPrev = this.dtCurr;
        this.dtCurr = dt;
        var bodies = this.bodies;
        var constraints = this.constraints;
        var arbiters = this.arbiters;
        // Reset and empty the arbiter lists.
        for (var _i = 0, arbiters_1 = arbiters; _i < arbiters_1.length; _i++) {
            var arb = arbiters_1[_i];
            arb.state = "normal";
            // If both bodies are awake, unthread the arbiter from the contact
            // graph.
            if (!arb.bodyA.isSleeping() && !arb.bodyB.isSleeping()) {
                arb.unthread();
            }
        }
        arbiters.length = 0;
        this.lock();
        {
            // Integrate positions
            for (var _a = 0, bodies_3 = bodies; _a < bodies_3.length; _a++) {
                var body = bodies_3[_a];
                body.position_func(dt);
            }
            // Find colliding pairs.
            // this.pushFreshContactBuffer();
            // TODO this should only visit active shapes.
            this.spatialIndex.each(updateFunc);
            this.spatialIndex.reindex();
            this.spatialIndex.touchingQuery(this.collideShapes);
        }
        this.unlock(false);
        // Rebuild the contact graph (and detect sleeping components if sleeping
        // is enabled)
        this.processComponents(dt);
        this.lock();
        {
            // Clear out old cached arbiters and call separate callbacks
            for (var hash in this.cachedArbiters) {
                if (!this.arbiterSetFilter(this.cachedArbiters.get(hash))) {
                    this.cachedArbiters.delete(hash);
                }
            }
            // Prestep the arbiters and constraints.
            var slop = this.collisionSlop;
            var biasCoef = 1 - Math.pow(this.collisionBias, dt);
            for (var _b = 0, arbiters_2 = arbiters; _b < arbiters_2.length; _b++) {
                var arbiter = arbiters_2[_b];
                arbiter.preStep(dt, slop, biasCoef);
            }
            for (var _c = 0, constraints_1 = constraints; _c < constraints_1.length; _c++) {
                var constraint = constraints_1[_c];
                constraint.preSolve(this);
                constraint.preStep(dt);
            }
            // Integrate velocities.
            var damping = Math.pow(this.damping, dt);
            var gravity = this.gravity;
            for (var _d = 0, bodies_4 = bodies; _d < bodies_4.length; _d++) {
                var body = bodies_4[_d];
                body.velocity_func(gravity, damping, dt);
            }
            // Apply cached impulses
            var dtCoef = (dtPrev === 0 ? 0 : dt / dtPrev);
            for (var _e = 0, arbiters_3 = arbiters; _e < arbiters_3.length; _e++) {
                var arbiter = arbiters_3[_e];
                arbiter.applyCachedImpulse(dtCoef);
            }
            for (var _f = 0, constraints_2 = constraints; _f < constraints_2.length; _f++) {
                var constraint = constraints_2[_f];
                constraint.applyCachedImpulse(dtCoef);
            }
            // Run the impulse solver.
            for (var i = 0; i < this.iterations; i++) {
                for (var _g = 0, arbiters_4 = arbiters; _g < arbiters_4.length; _g++) {
                    var arbiter = arbiters_4[_g];
                    arbiter.applyImpulse();
                }
                for (var _h = 0, constraints_3 = constraints; _h < constraints_3.length; _h++) {
                    var constraint = constraints_3[_h];
                    constraint.applyImpulse();
                }
            }
            // Run the constraint post-solve callbacks
            for (var _j = 0, constraints_4 = constraints; _j < constraints_4.length; _j++) {
                var constraint = constraints_4[_j];
                constraint.postSolve(this);
            }
            // run the post-solve callbacks
            for (var _k = 0, arbiters_5 = arbiters; _k < arbiters_5.length; _k++) {
                var arbiter = arbiters_5[_k];
                arbiter.handler.postSolve(arbiter, this);
            }
        }
        this.unlock(true);
    };
    return Space;
}());

var v$1 = v;
var Terrain = /** @class */ (function () {
    function Terrain(space) {
        this.space = space;
        this.components = [
            { f: 1 / 30, a: 10 },
            { f: 1 / 70, a: 30 },
            { f: 1 / 150, a: 40 },
            { f: 1 / 190, a: 40 },
            { f: 1 / 310, a: 40 }
        ];
        this.max = 0;
        for (var i in this.components) {
            this.max += Math.abs(this.components[i].a);
        }
        this.min = -this.max;
        this.shapes = [];
    }
    Terrain.prototype.getHeight = function (x) {
        var height = 0;
        // height is built as the sum of a load of sin functions
        for (var i in this.components) {
            height += this.components[i].a * Math.sin(x * this.components[i].f);
        }
        // flatten out valleys and sharpen peaks
        height = (Math.pow(height - this.min, 2) / (this.max - this.min)) + this.min;
        // smooth out start of course
        if (x < 600) {
            height *= 0.5 * (1 - Math.cos(x * Math.PI / 600));
        }
        return height;
    };
    Terrain.prototype.updateBounds = function (left, right) {
        var step = 20;
        var space = this.space;
        var shapes = this.shapes;
        var shape;
        var start, end;
        var i, x;
        var a, b;
        var makeSegment = function (a, b) {
            var shape = new SegmentShape(space.staticBody, a, b, 0);
            shape.setCollisionType(1);
            shape.setElasticity(1);
            shape.setFriction(0.9);
            return shape;
        };
        // prune end
        for (i = shapes.length - 1; i >= 0; i--) {
            shape = shapes[i];
            if (shape.a.x > right) {
                space.removeShape(shape);
            }
            else {
                break;
            }
        }
        shapes.splice(i + 1, shapes.length - i - 1);
        // prune beginning
        for (i = 0; i < shapes.length; i++) {
            shape = shapes[i];
            if (shape.b.x < left) {
                space.removeShape(shape);
            }
            else {
                break;
            }
        }
        shapes.splice(0, i);
        // add segments to end
        if (shapes.length) {
            start = shapes[shapes.length - 1].b.x;
        }
        else {
            start = left - (left % step);
        }
        end = right + step;
        a = v$1(start, this.getHeight(start));
        for (x = start + step; x < end; x += step) {
            b = v$1(x, this.getHeight(x));
            shape = makeSegment(a, b);
            shapes.push(shape);
            space.addShape(shape);
            a = b;
        }
        // add segments to beginning
        start = left - (left % step) - step;
        if (shapes.length) {
            end = shapes[0].a.x;
        }
        else {
            // already failed to add anything to the end
            return;
        }
        b = v$1(end, this.getHeight(end));
        for (x = end - step; x > start; x -= step) {
            a = v$1(x, this.getHeight(x));
            shape = makeSegment(a, b);
            shapes.unshift(shape);
            space.addShape(shape);
            b = a;
        }
    };
    Terrain.prototype.drawFill = function (ctx, box, res) {
        var step = 20;
        ctx.save();
        ctx.fillStyle = ctx.createPattern(res.get('ground'), 'repeat');
        ctx.beginPath();
        ctx.moveTo(box.left, box.bottom);
        for (var x = box.left - (box.left % step); x < box.right + step; x += step) {
            ctx.lineTo(x, this.getHeight(x));
        }
        ctx.lineTo(box.right, box.bottom);
        ctx.fill();
        ctx.restore();
    };
    Terrain.prototype.drawBorder = function (ctx, box, res) {
        var borderImage = res.get('border');
        var borderHeight = 24;
        var borderScale = borderHeight / borderImage.height;
        var borderRepeat = borderImage.width * borderScale;
        var step = 20;
        for (var x = box.left - (box.left % step); x < box.right; x += step) {
            ctx.save();
            var a = v$1(x, this.getHeight(x));
            var b = v$1(x + step, this.getHeight(x + step));
            var gradient = (b.y - a.y) / (b.x - a.x);
            // TODO it seems unlikely that this is the most efficient way to use the gpu
            ctx.transform(1, gradient, 0, 1, 0, a.y + 2 - a.x * gradient);
            ctx.scale(1, -1);
            var sectionStart = x - (x % borderRepeat);
            var sectionFinish = sectionStart + borderRepeat;
            while (sectionStart < b.x) {
                var canvasStart = Math.max(a.x, sectionStart);
                var canvasWidth = Math.min(b.x, sectionFinish) - canvasStart;
                var imageStart = Math.floor((canvasStart / borderScale) % borderImage.width);
                var imageWidth = Math.ceil(canvasWidth / borderScale);
                if (!imageWidth) {
                    break;
                }
                ctx.drawImage(borderImage, imageStart, 0, imageWidth, borderImage.height, canvasStart, -0.5 * borderHeight, canvasWidth, borderHeight);
                sectionStart += borderRepeat;
                sectionFinish += borderRepeat;
            }
            ctx.restore();
        }
    };
    Terrain.prototype.draw = function (ctx, box, res) {
        this.drawFill(ctx, box, res);
        this.drawBorder(ctx, box, res);
    };
    return Terrain;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics$1 = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends$1(d, b) {
    extendStatics$1(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var v$2 = v;
var Wheel = /** @class */ (function (_super) {
    __extends$1(Wheel, _super);
    function Wheel(space, spec) {
        var _this = _super.call(this, spec.mass, momentForCircle(spec.mass, spec.radius, spec.radius, v$2(0, 0))) || this;
        _this.spec = spec;
        var shape = new CircleShape(_this, spec.radius, v$2(0, 0));
        shape.setElasticity(0);
        shape.setFriction(spec.friction);
        shape.group = 1;
        shape.setCollisionType(2);
        space.addShape(shape);
        space.addBody(_this);
        return _this;
    }
    Wheel.prototype.draw = function (ctx, viewbox, res) {
        var r = this.spec.radius;
        ctx.save();
        ctx.translate(this.p.x, this.p.y);
        ctx.rotate(this.a);
        ctx.scale(1, -1);
        ctx.drawImage(res.get('wheel'), -r, -r, 2 * r, 2 * r);
        ctx.restore();
    };
    return Wheel;
}(Body));
var Vehicle = /** @class */ (function () {
    function Vehicle(space, spec, offset) {
        this.spec = spec;
        var makeChassis = function (space, spec) {
            var body = new Body(spec.mass, momentForBox(spec.mass, 80, 40));
            space.addBody(body);
            var bodyShape = new PolyShape(body, spec.body_outline.map(function (c) {
                return c * spec.body_outline_scale;
            }), vmult(spec.body_outline_offset, spec.body_outline_scale));
            bodyShape.setFriction(1.2);
            bodyShape.group = 1;
            space.addShape(bodyShape);
            var cabShape = new PolyShape(body, spec.cab_outline.map(function (c) {
                return c * spec.cab_outline_scale;
            }), vmult(spec.cab_outline_offset, spec.body_outline_scale));
            cabShape.setFriction(1.2);
            cabShape.group = 1;
            space.addShape(cabShape);
            return body;
        };
        var makeSuspension = function (space, spec, chassis, wheel) {
            wheel.setPos(v$2(chassis.p.x + spec.spring_anchor.x, chassis.p.y + spec.spring_anchor.y - spec.spring_length));
            var arm = new PinJoint(chassis, wheel, spec.arm_anchor, v$2(0, 0));
            space.addConstraint(arm);
            var spring = new DampedSpring(chassis, wheel, spec.spring_anchor, v$2(0, 0), spec.spring_length, spec.stiffness, spec.damping);
            space.addConstraint(spring);
        };
        this.chassis = makeChassis(space, spec);
        this.chassis.setPos(offset);
        this.frontWheel = new Wheel(space, spec.front_wheel);
        makeSuspension(space, spec.front_suspension, this.chassis, this.frontWheel);
        this.backWheel = new Wheel(space, spec.back_wheel);
        makeSuspension(space, spec.back_suspension, this.chassis, this.backWheel);
        this.frontMotor = new SimpleMotor(this.chassis, this.frontWheel, 0);
        this.frontMotor.maxForce = 0;
        space.addConstraint(this.frontMotor);
        this.backMotor = new SimpleMotor(this.chassis, this.backWheel, 0);
        this.backMotor.maxForce = 0;
        space.addConstraint(this.backMotor);
        // driver
        this.driver = new Body(0.1, momentForBox(0.1, 2, 4));
        this.driver.setPos(v$2(this.chassis.p.x - 4.5 + 1, this.chassis.p.y + 10 - 5));
        space.addBody(this.driver);
        space.addConstraint(new PivotJoint(this.chassis, this.driver, v$2(-4.5, 10), v$2(1, -5)));
        space.addConstraint(new RotaryLimitJoint(this.chassis, this.driver, -0.9, 0.0));
        space.addConstraint(new DampedRotarySpring(this.chassis, this.driver, 0.1, 1000, 10));
        // TODO make this work for different sized wheels
        this.differential = new SimpleMotor(this.frontWheel, this.backWheel, 0);
        this.differential.maxForce = spec.differential.torque;
        space.addConstraint(this.differential);
    }
    Object.defineProperty(Vehicle.prototype, "p", {
        get: function () {
            return this.chassis.p;
        },
        enumerable: true,
        configurable: true
    });
    Vehicle.prototype.setThrottle = function (throttle) {
        var spec = this.spec;
        if (throttle) {
            this.frontMotor.rate = (throttle < 0 ? -1 : 1) * spec.front_motor.rate;
            this.frontMotor.maxForce = Math.abs(throttle) * spec.front_motor.torque;
            this.backMotor.rate = (throttle < 0 ? -1 : 1) * spec.back_motor.rate;
            this.backMotor.maxForce = Math.abs(throttle) * spec.back_motor.torque;
            this.frontMotor.activateBodies();
            this.backMotor.activateBodies();
        }
        else {
            this.frontMotor.rate = 0;
            this.frontMotor.maxForce = 0.03 * spec.front_motor.torque;
            this.backMotor.rate = 0;
            this.backMotor.maxForce = 0.03 * spec.back_motor.torque;
        }
    };
    Vehicle.prototype.isCrashed = function () {
        var crashed = false;
        // vehicle has stopped moving
        if (this.chassis.isSleeping()) {
            var angle = Math.abs(this.chassis.a % (2 * Math.PI));
            if ((angle > 0.5 * Math.PI) && (angle < 1.5 * Math.PI)) {
                // vehicle is in contact with ground
                this.chassis.eachArbiter(function (arb) {
                    crashed = true;
                });
            }
        }
        return crashed;
    };
    Vehicle.prototype.draw = function (ctx, viewbox, res) {
        var spec = this.spec;
        // draw driver
        ctx.save();
        ctx.translate(this.driver.p.x, this.driver.p.y);
        ctx.rotate(this.driver.a);
        ctx.scale(1, -1);
        ctx.drawImage(res.get('driver'), -5, -5, 12, 12);
        ctx.restore();
        ctx.save();
        ctx.translate(this.chassis.p.x, this.chassis.p.y);
        ctx.rotate(this.chassis.a);
        ctx.scale(spec.image_scale, spec.image_scale);
        ctx.translate(spec.image_offset.x, spec.image_offset.y);
        ctx.scale(1, -1);
        ctx.drawImage(res.get('body'), 0, 0);
        ctx.restore();
        this.frontWheel.draw(ctx, viewbox, res);
        this.backWheel.draw(ctx, viewbox, res);
    };
    return Vehicle;
}());

var v$3 = v;
var Dust = /** @class */ (function () {
    function Dust(space, a, b) {
        space.addCollisionHandler(a, b, false, false, this.onPostSolve.bind(this), false);
        this.particles = [];
    }
    Dust.prototype.onPostSolve = function (arb, space) {
        for (var i in arb.contacts) {
            var contact = arb.contacts[i];
            // only emit dust once every ten or so frames
            if (!Math.floor(Math.random() * 10)) {
                // Approximately 1 or 2 while driving, 20 on heavy acceleration,
                // up to about 100 when crashing
                var acc = contact.jtAcc;
                this.particles.push({
                    p: v$3(contact.p.x, contact.p.y),
                    strength: Math.sqrt(acc),
                    age: 0
                });
            }
        }
    };
    Dust.prototype.draw = function (ctx, box, res) {
        ctx.save();
        var sprite = res.get("dust");
        for (var i in this.particles) {
            var particle = this.particles[i];
            var radius = 30 * particle.age;
            ctx.globalAlpha = 1 - 0.25 * particle.age;
            ctx.drawImage(sprite, particle.p.x - radius, particle.p.y, radius, radius);
        }
        ctx.restore();
    };
    Dust.prototype.update = function (dt) {
        for (var i in this.particles) {
            this.particles[i].age += dt;
        }
        this.particles = this.particles.filter(function (p) { return p.age < 4; });
    };
    return Dust;
}());

var rightPressed = false;
var leftPressed = false;
function onKeyDown(e) {
    if (e.keyCode === 39) {
        rightPressed = true;
        return false;
    }
    else if (e.keyCode === 37) {
        leftPressed = true;
        return false;
    }
}
function onKeyUp(e) {
    if (e.keyCode === 39) {
        rightPressed = false;
        return false;
    }
    else if (e.keyCode === 37) {
        leftPressed = false;
        return false;
    }
}
function leftPedalDown(e) {
    leftPressed = true;
    e.preventDefault();
    return false;
}
function leftPedalUp(e) {
    leftPressed = false;
    e.preventDefault();
    return false;
}
function rightPedalDown(e) {
    rightPressed = true;
    e.preventDefault();
    return false;
}
function rightPedalUp(e) {
    rightPressed = false;
    e.preventDefault();
    return false;
}
function init() {
    // Keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    // Touch screen
    if (!!('ontouchstart' in document.documentElement)) {
        var leftPedal = document.getElementById('leftPedal');
        var rightPedal = document.getElementById('rightPedal');
        leftPedal.hidden = false;
        rightPedal.hidden = false;
        leftPedal.addEventListener('touchstart', leftPedalDown);
        leftPedal.addEventListener('touchleave', leftPedalUp);
        leftPedal.addEventListener('touchend', leftPedalUp);
        rightPedal.addEventListener('touchstart', rightPedalDown);
        rightPedal.addEventListener('touchleave', rightPedalUp);
        rightPedal.addEventListener('touchend', rightPedalUp);
    }
}

var v$4 = v;
var Game = /** @class */ (function () {
    function Game(config) {
        this.onCrashed = null;
        this.config = config;
        /* Initialise Chipmunk Physics*/
        var space = this.space = new Space();
        space.iterations = 10;
        space.sleepTimeThreshold = 0.5;
        space.gravity = v$4(0, -config['gravity']);
        /* Build Scene */
        var giantInvisibleWall = new SegmentShape(space.staticBody, v$4(0, -10000), v$4(0, 10000), 0);
        giantInvisibleWall.setElasticity(2);
        space.addShape(giantInvisibleWall);
        this.terrain = new Terrain(space);
        this.vehicle = new Vehicle(space, config['vehicle'], v$4(100, 100));
        this.dust = new Dust(space, 1, 2);
        this.dirty = true;
        init();
    }
    Game.prototype.update = function (dt) {
        /* Handle Input */
        if (rightPressed && !leftPressed) {
            this.vehicle.setThrottle(1);
        }
        else if (leftPressed && !rightPressed) {
            this.vehicle.setThrottle(-1);
        }
        else {
            this.vehicle.setThrottle(0);
        }
        if (this.vehicle.isCrashed()) {
            this.crashed();
        }
        this.terrain.updateBounds(this.vehicle.p.x - 100, this.vehicle.p.x + 100);
        this.dust.update(dt);
        /* Run Physics */
        this.space.step(dt);
        this.dirty = true;
        //if (this.space.activeShapes.count) {
        //    this.dirty = true;
        //}
        // TODO
        //if (this.dust.particles.length) {
        //    this.dirty = true;
        //}
    };
    Game.prototype.crashed = function () {
        if (this.onCrashed) {
            this.onCrashed();
        }
    };
    Game.prototype.draw = function (ctx, res) {
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;
        /* Figure out where to position the camera */
        var bottom = this.terrain.max - 1.05 * (this.terrain.max - this.terrain.min);
        var top = this.terrain.min + 1.5 * (this.terrain.max - this.terrain.min);
        var scale = height / (top - bottom);
        var left = Math.max(0, this.vehicle.p.x - (width / (3 * scale)));
        var right = left + width / scale;
        var viewport = {
            top: top,
            bottom: bottom,
            left: left,
            right: right,
        };
        /* Clear the screen */
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        /* Draw everything */
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scale, -scale);
        ctx.translate(-viewport.left, -viewport.top);
        this.vehicle.draw(ctx, viewport, res);
        this.terrain.draw(ctx, viewport, res);
        this.dust.draw(ctx, viewport, res);
        this.dirty = false;
    };
    return Game;
}());

var v$5 = v;
var data = {
    "gravity": 200,
    "vehicle": {
        "mass": 5,
        "image": "",
        "image_scale": 85 / 256,
        "image_offset": v$5(-128, 75),
        "body_outline": [
            1, -48,
            165, -48,
            240, -51,
            248, -84,
            155, -106,
            92, -107,
            1, -84
        ],
        "body_outline_scale": 85 / 256,
        "body_outline_offset": v$5(-128, 75),
        "cab_outline": [
            72, -48,
            91, -3,
            146, -12,
            165, -48
        ],
        "cab_outline_scale": 85 / 256,
        "cab_outline_offset": v$5(-128, 75),
        "front_wheel": {
            "mass": 0.15,
            "radius": 13,
            "friction": 1.2
        },
        "front_suspension": {
            "stiffness": 450,
            "damping": 12,
            "spring_anchor": v$5(30, 10),
            "spring_length": 28,
            "arm_anchor": v$5(0, -10)
        },
        "front_motor": {
            "torque": 7500,
            "rate": 20 * Math.PI
        },
        "back_wheel": {
            "mass": 0.15,
            "radius": 13,
            "friction": 1.2
        },
        "back_suspension": {
            "stiffness": 450,
            "damping": 12,
            "spring_anchor": v$5(-30, 10),
            "spring_length": 28,
            "arm_anchor": v$5(0, -10)
        },
        "back_motor": {
            "torque": 7500,
            "rate": 20 * Math.PI
        },
        "differential": {
            "torque": 7500
        }
    }
};

var TextureManager = /** @class */ (function () {
    function TextureManager(textures) {
        this.onLoad = null;
        this.onProgress = null;
        this.textures = new Map();
        this.total = 0;
        this.remaining = 0;
        // XXX just going to assume that iterating over keys is fine...
        for (var name_1 in textures) {
            this.total++;
            this.remaining++;
            var image = new Image();
            image.onload = this.textureLoaded.bind(this);
            image.src = textures[name_1];
            this.textures.set(name_1, image);
        }
    }
    TextureManager.prototype.textureLoaded = function (name) {
        this.remaining--;
        if (this.remaining) {
            if (this.onProgress) {
                this.onProgress(this, this.total, this.remaining);
            }
        }
        else if (this.onLoad) {
            this.onLoad(this);
        }
    };
    TextureManager.prototype.get = function (name) {
        return this.textures.get(name);
    };
    return TextureManager;
}());

var State;
(function (State) {
    State[State["Loading"] = 0] = "Loading";
    State[State["MainMenu"] = 1] = "MainMenu";
    State[State["Game"] = 2] = "Game";
    State[State["Paused"] = 3] = "Paused";
})(State || (State = {}));
var Application = /** @class */ (function () {
    function Application(canvas) {
        var _this = this;
        this.game = null;
        this.fsm = new typestateNode_1.FiniteStateMachine(State.Loading);
        this.fsm.from(State.Loading).to(State.MainMenu);
        this.fsm.from(State.MainMenu).to(State.Game);
        this.fsm.from(State.Game).to(State.Paused);
        this.fsm.from(State.Paused).to(State.Game);
        this.fsm.from(State.Game).to(State.MainMenu);
        this.fsm.onEnter(State.MainMenu, this.onEnterMainMenu.bind(this));
        this.fsm.onExit(State.MainMenu, this.onLeaveMainMenu.bind(this));
        this.fsm.onEnter(State.Game, this.onEnterGame.bind(this));
        this.fsm.on(State.Game, function (from, event) { _this.loop(); });
        // StateMachine.create({
        //     initial: 'loading',
        //     events: [
        //         { name: 'loaded', from: 'loading', to: 'mainMenu' },
        //         { name: 'start', from: 'mainMenu', to: 'game' },
        //         { name: 'pause', from: 'game', to: 'paused' },
        //         { name: 'resume', from: 'paused', to: 'game' },
        //         { name: 'crashed', from: 'game', to: 'mainMenu' }
        //     ]
        // }, this);
        document.getElementById('play-btn').onclick = function () { _this.start(); };
        this.lastTime = 0;
        /* Initialise Statistics */
        this.simulationTime = 0;
        this.drawTime = 0;
        this.fps = 0;
        /* Initialise Rendering */
        canvas.oncontextmenu = function (e) { e.preventDefault(); };
        canvas.onmousedown = function (e) { e.preventDefault(); };
        canvas.onmouseup = function (e) { e.preventDefault(); };
        this.ctx = canvas.getContext('2d');
        /* Bind callback to resize canvas */
        if (!this.hasOwnProperty('resize')) {
            this.resize = this.resize.bind(this);
        }
        // TODO bind to canvas resize event not windo resize event
        window.addEventListener('resize', this.resize);
        this.resize();
        this.textureManager = new TextureManager({
            'wheel': 'img/wheel.png',
            'body': 'img/body.png',
            'driver': 'img/driver.png',
            'ground': 'img/ground.png',
            'border': 'img/border.png',
            'dust': 'img/dust.png'
        });
        this.textureManager.onLoad = this.loaded.bind(this);
    }
    Object.defineProperty(Application.prototype, "state", {
        get: function () {
            return this.fsm.currentState;
        },
        enumerable: true,
        configurable: true
    });
    Application.prototype.loaded = function () {
        this.fsm.go(State.MainMenu);
    };
    Application.prototype.start = function () {
        this.fsm.go(State.Game);
    };
    Application.prototype.pause = function () {
        this.fsm.go(State.Paused);
    };
    Application.prototype.resume = function () {
        this.fsm.go(State.Game);
    };
    Application.prototype.crashed = function () {
        this.fsm.go(State.MainMenu);
    };
    Application.prototype.onEnterState = function (event, from, to) {
        this.loop();
    };
    Application.prototype.onEnterMainMenu = function (from, event) {
        document.getElementById('main-menu').classList.remove('hidden');
        return true;
    };
    Application.prototype.onLeaveMainMenu = function (to) {
        document.getElementById('main-menu').classList.add('hidden');
        return true;
    };
    Application.prototype.onEnterGame = function (from, event) {
        var _this = this;
        if (from == State.MainMenu) {
            this.game = new Game(data);
            this.game.onCrashed = function () { _this.crashed(); };
        }
        return true;
    };
    Application.prototype.requestUpdate = function () {
        if (!this.updateQueued) {
            this.updateQueued = true;
            window.requestAnimationFrame(this.update.bind(this));
        }
    };
    Application.prototype.loop = function () {
        switch (this.state) {
            case State.Game:
                this.requestUpdate();
                break;
        }
    };
    Application.prototype.update = function (time) {
        this.updateQueued = false;
        var now;
        var dt = time - this.lastTime;
        this.lastTime = time;
        // Update FPS
        if (dt > 0) {
            this.fps = 0.9 * this.fps + 0.1 * (1000 / dt);
        }
        switch (this.state) {
            case State.Game:
                now = Date.now();
                this.game.update(Math.max(1 / 60, Math.min(0.001 * dt, 1 / 30)));
                this.simulationTime += Date.now() - now;
                if (this.game.dirty || this.resized) {
                    this.resized = false;
                    now = Date.now();
                    this.game.draw(this.ctx, this.textureManager);
                    this.drawTime += Date.now() - now;
                }
                break;
        }
        this.drawInfo();
        this.loop();
    };
    Application.prototype.resize = function () {
        var canvas = this.ctx.canvas;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.resized = true;
    };
    Application.prototype.drawInfo = function () {
        var fpsStr = Math.floor(this.fps * 10) / 10;
        document.getElementById('fps').textContent = "" + fpsStr;
        // document.getElementById('step').textContent = ""+this.game.space.stamp;
        document.getElementById('simulationTime').textContent = "" + this.simulationTime + " ms";
        document.getElementById('drawTime').textContent = "" + this.drawTime + " ms";
    };
    return Application;
}());

exports.Application = Application;

return exports;

}({}));
//# sourceMappingURL=bundle.js.map
