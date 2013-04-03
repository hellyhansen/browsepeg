// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 12380;
assert(STATICTOP < TOTAL_MEMORY);
allocate(4, "i8", ALLOC_NONE, 5242880);
allocate([4,0,0,0,68,0,0,0,32,0,0,0,10,0,0,0,84,0,0,0,8,0,0,0,72,0,0,0,30,0,0,0,78,0,0,0,86,0,0,0,24,0,0,0,48,0,0,0,14,0,0,0,102,0,0,0,106,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5242884);
allocate([0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,16,0,0,0,18,0,0,0,20,0,0,0,22,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,36,0,0,0,40,0,0,0,44,0,0,0,48,0,0,0,52,0,0,0,56,0,0,0,64,0,0,0,72,0,0,0,80,0,0,0,88,0,0,0,96,0,0,0,104,0,0,0,112,0,0,0], "i8", ALLOC_NONE, 5242944);
allocate([0,1,8,16,9,2,3,10,17,24,32,25,18,11,4,5,12,19,26,33,40,48,41,34,27,20,13,6,7,14,21,28,35,42,49,56,57,50,43,36,29,22,15,23,30,37,44,51,58,59,52,45,38,31,39,46,53,60,61,54,47,55,62,63] /* \00\01\08\10\09\02\0 */, "i8", ALLOC_NONE, 5243072);
allocate([0,8,16,24,1,9,2,10,17,25,32,40,48,56,57,49,41,33,26,18,3,11,4,12,19,27,34,42,50,58,35,43,51,59,20,28,5,13,6,14,21,29,36,44,52,60,37,45,53,61,22,30,7,15,23,31,38,46,54,62,39,47,55,63] /* \00\08\10\18\01\09\0 */, "i8", ALLOC_NONE, 5243136);
allocate([58,0,0,0,154,0,0,0,88,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5243200);
allocate([124,0,0,0,52,0,0,0,76,0,0,0,94,0,0,0,128,0,0,0,54,0,0,0,28,0,0,0,118,0,0,0,26,0,0,0,96,0,0,0,74,0,0,0,62,0,0,0,40,0,0,0,22,0,0,0,98,0,0,0,80,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5243236);
allocate(64, "i8", ALLOC_NONE, 5243300);
allocate(4, "i8", ALLOC_NONE, 5243364);
allocate(4, "i8", ALLOC_NONE, 5243368);
allocate([0,0,0,0,237,46,17,0,136,42,17,0,192,122,16,0,36,191,13,0,160,187,13,0,96,61,8,0,146,223,6,0,208,221,6,0,64,119,27,0,192,101,82,0,224,50,41,0,16,85,34,0,64,119,27,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243372);
allocate([0,0,0,0,12,0,0,0,140,0,0,0,134,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,136,0,0,0,44,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5243436);
allocate(4, "i8", ALLOC_NONE, 5243472);
allocate(4, "i8", ALLOC_NONE, 5243476);
allocate(7936, "i8", ALLOC_NONE, 5243480);
allocate(4, "i8", ALLOC_NONE, 5251416);
allocate(24, "i8", ALLOC_NONE, 5251420);
allocate(4, "i8", ALLOC_NONE, 5251444);
allocate(4, "i8", ALLOC_NONE, 5251448);
allocate([0,32,33,1,64,96,97,65,66,98,99,67,2,34,35,3,128,160,161,129,192,224,225,193,194,226,227,195,130,162,163,131,132,164,165,133,196,228,229,197,198,230,231,199,134,166,167,135,4,36,37,5,68,100,101,69,70,102,103,71,6,38,39,7] /* \00 !\01@`aABbcC\02\ */, "i8", ALLOC_NONE, 5251452);
allocate([0,0,23,54,5,13,29,68,1,3,24,58,7,17,30,71,0,0,23,54,5,13,29,68,1,3,24,58,7,17,30,71,0,0,23,54,5,13,29,68,1,3,24,58,7,17,30,71,0,0,23,54,5,13,29,68,1,3,24,58,7,17,30,71,15,36,7,18,21,50,13,31,17,39,9,21,22,53,15,35,15,36,7,18,21,50,13,31,17,39,9,21,22,53,15,35,15,36,7,18,21,50,13,31,17,39,9,21,22,53,15,35,15,36,7,18,21,50,13,31,17,39,9,21,22,53,15,35,3,9,27,63,1,4,25,59,5,12,28,67,3,7,26,62,3,9,27,63,1,4,25,59,5,12,28,67,3,7,26,62,3,9,27,63,1,4,25,59,5,12,28,67,3,7,26,62,3,9,27,63,1,4,25,59,5,12,28,67,3,7,26,62,19,45,11,27,17,41,9,22,21,49,13,30,19,44,11,26,19,45,11,27,17,41,9,22,21,49,13,30,19,44,11,26,19,45,11,27,17,41,9,22,21,49,13,30,19,44,11,26,19,45,11,27,17,41,9,22,21,49,13,30,19,44,11,26,0,2,24,57,6,15,30,70,0,1,23,55,6,14,29,69,0,2,24,57,6,15,30,70,0,1,23,55,6,14,29,69,0,2,24,57,6,15,30,70,0,1,23,55,6,14,29,69,0,2,24,57,6,15,30,70,0,1,23,55,6,14,29,69,16,38,8,20,22,52,14,34,16,37,8,19,21,51,14,33,16,38,8,20,22,52,14,34,16,37,8,19,21,51,14,33,16,38,8,20,22,52,14,34,16,37,8,19,21,51,14,33,16,38,8,20,22,52,14,34,16,37,8,19,21,51,14,33,4,11,28,66,2,6,26,61,4,10,27,65,2,5,25,60,4,11,28,66,2,6,26,61,4,10,27,65,2,5,25,60,4,11,28,66,2,6,26,61,4,10,27,65,2,5,25,60,4,11,28,66,2,6,26,61,4,10,27,65,2,5,25,60,20,47,12,29,18,43,10,25,20,46,12,28,18,42,10,23,20,47,12,29,18,43,10,25,20,46,12,28,18,42,10,23,20,47,12,29,18,43,10,25,20,46,12,28,18,42,10,23,20,47,12,29,18,43,10,25,20,46,12,28,18,42,10,23,0,0,23,54,5,13,29,68,1,3,24,58,7,17,30,71,0,0,23,54,5,13,29,68,1,3,24,58,7,17,30,71,0,0,23,54,5,13,29,68,1,3,24,58,7,17,30,71,0,0,23,54,5,13,29,68,1,3,24,58,7,17,30,71,15,36,7,18,21,50,13,31,17,39,9,21,22,53,15,35,15,36,7,18,21,50,13,31,17,39,9,21,22,53,15,35] /* \00\00\176\05\0D\1DD */, "i8", ALLOC_NONE, 5251516);
allocate([8,16,16,19,16,19,22,22,22,22,22,22,26,24,26,27,27,27,26,26,26,26,27,27,27,29,29,29,34,34,34,29,29,29,27,27,29,29,32,32,34,34,37,38,37,35,35,34,35,38,38,40,40,40,48,48,46,46,56,56,58,69,69,83] /* \08\10\10\13\10\13\1 */, "i8", ALLOC_NONE, 5252124);
allocate(4, "i8", ALLOC_NONE, 5252188);
allocate([114,98,0] /* rb\00 */, "i8", ALLOC_NONE, 5252192);
allocate(472, "i8", ALLOC_NONE, 5252196);
allocate([3,6,2,4,1,3,1,3,0,2,0,2,0,2,0,2], "i8", ALLOC_NONE, 5252668);
allocate([0,10,0,10,0,10,0,10,0,10,0,10,0,10,0,10,0,10,0,10,0,10,0,10,15,10,14,10,13,10,12,10,11,10,10,10,9,9,9,9,8,9,8,9,7,9,7,9,6,7,6,7,6,7,6,7,6,7,6,7,6,7,6,7,5,7,5,7,5,7,5,7,5,7,5,7,5,7,5,7,4,7,4,7,4,7,4,7,4,7,4,7,4,7,4,7], "i8", ALLOC_NONE, 5252684);
allocate([17,6,18,5,26,5,1,5,8,3,8,3,8,3,8,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1], "i8", ALLOC_NONE, 5252780);
allocate([17,2,1,1], "i8", ALLOC_NONE, 5252844);
allocate([0,0,17,6,22,6,26,6,30,5,30,5,1,5,1,5,8,4,8,4,8,4,8,4,10,4,10,4,10,4,10,4,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,6,3,6,3,6,3,6,3,6,3,6,3,6,3,6,3,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,12,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2,14,2], "i8", ALLOC_NONE, 5252848);
allocate([6,5,5,5,4,4,4,4,3,4,3,4,2,3,2,3,2,3,2,3,1,3,1,3,1,3,1,3,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1], "i8", ALLOC_NONE, 5252976);
allocate([32,11,31,11,30,11,29,11,28,11,27,11,26,11,25,11,24,11,23,11,22,11,21,11,20,10,20,10,19,10,19,10,18,10,18,10,17,10,17,10,16,10,16,10,15,10,15,10,14,8,14,8,14,8,14,8,14,8,14,8,14,8,14,8,13,8,13,8,13,8,13,8,13,8,13,8,13,8,13,8,12,8,12,8,12,8,12,8,12,8,12,8,12,8,12,8,11,8,11,8,11,8,11,8,11,8,11,8,11,8,11,8,10,8,10,8,10,8,10,8,10,8,10,8,10,8,10,8,9,8,9,8,9,8,9,8,9,8,9,8,9,8,9,8,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7], "i8", ALLOC_NONE, 5253036);
allocate([0,1,0,1,1,2,-1,2], "i8", ALLOC_NONE, 5253244);
allocate([1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,3,0,3,0,3,0,3,3,3,3,3,3,3,3,3,4,3,4,3,4,3,4,3,5,4,5,4,6,5], "i8", ALLOC_NONE, 5253252);
allocate([6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,6,5,7,6,7,6,7,6,7,6,7,6,7,6,7,6,7,6,8,7,8,7,8,7,8,7,9,8,9,8,10,9,11,9], "i8", ALLOC_NONE, 5253316);
allocate([0,2,0,2,0,2,0,2,0,2,0,2,0,2,0,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,4,4,4,4,5,5], "i8", ALLOC_NONE, 5253380);
allocate([65,0,6,65,0,6,65,0,6,65,0,6,8,1,7,8,1,7,9,1,7,9,1,7,7,1,7,7,1,7,3,2,7,3,2,7,1,7,6,1,7,6,1,7,6,1,7,6,1,6,6,1,6,6,1,6,6,1,6,6,5,1,6,5,1,6,5,1,6,5,1,6,6,1,6,6,1,6,6,1,6,6,1,6,2,5,8,12,1,8,1,11,8,1,10,8,14,1,8,13,1,8,4,2,8,2,4,8,3,1,5,3,1,5,3,1,5,3,1,5,3,1,5,3,1,5,3,1,5,3,1,5,2,2,5,2,2,5,2,2,5,2,2,5,2,2,5,2,2,5,2,2,5,2,2,5,4,1,5,4,1,5,4,1,5,4,1,5,4,1,5,4,1,5,4,1,5,4,1,5,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,-127,0,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,4,5,1,4,5,1,4,5,1,4,5,1,4,5,1,4,5,1,4,5,1,4,5,1,5,5,1,5,5,1,5,5,1,5,5,1,5,5,1,5,5,1,5,5,1,5,5,10,1,7,10,1,7,2,3,7,2,3,7,11,1,7,11,1,7,1,8,7,1,8,7,1,9,7,1,9,7,1,12,8,1,13,8,3,3,8,5,2,8,1,14,8,1,15,8], "i8", ALLOC_NONE, 5253444);
allocate([6,2,9,6,2,9,15,1,9,15,1,9,3,4,10,17,1,10,16,1,9,16,1,9], "i8", ALLOC_NONE, 5254200);
allocate([65,0,6,65,0,6,65,0,6,65,0,6,3,2,7,3,2,7,10,1,7,10,1,7,1,4,7,1,4,7,9,1,7,9,1,7,8,1,6,8,1,6,8,1,6,8,1,6,7,1,6,7,1,6,7,1,6,7,1,6,2,2,6,2,2,6,2,2,6,2,2,6,6,1,6,6,1,6,6,1,6,6,1,6,14,1,8,1,6,8,13,1,8,12,1,8,4,2,8,2,3,8,1,5,8,11,1,8], "i8", ALLOC_NONE, 5254224);
allocate([17,1,10,6,2,10,1,7,10,3,3,10,2,4,10,16,1,10,15,1,10,5,2,10], "i8", ALLOC_NONE, 5254332);
allocate([1,3,5,5,1,5,4,1,5,1,2,4,1,2,4,3,1,4,3,1,4,2,1,3,2,1,3,2,1,3,2,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], "i8", ALLOC_NONE, 5254356);
allocate([1,3,5,5,1,5,4,1,5,1,2,4,1,2,4,3,1,4,3,1,4,2,1,3,2,1,3,2,1,3,2,1,3,-127,0,2,-127,0,2,-127,0,2,-127,0,2,-127,0,2,-127,0,2,-127,0,2,-127,0,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2,1,1,2], "i8", ALLOC_NONE, 5254440);
allocate([-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,-127,0,0,2,18,0,2,17,0,2,16,0,2,15,0,7,3,0,17,2,0,16,2,0,15,2,0,14,2,0,13,2,0,12,2,0,32,1,0,31,1,0,30,1,0,29,1,0,28,1,0], "i8", ALLOC_NONE, 5254524);
allocate([1,40,15,1,39,15,1,38,15,1,37,15,1,36,15,1,35,15,1,34,15,1,33,15,1,32,15,2,14,15,2,13,15,2,12,15,2,11,15,2,10,15,2,9,15,2,8,15,1,31,14,1,31,14,1,30,14,1,30,14,1,29,14,1,29,14,1,28,14,1,28,14,1,27,14,1,27,14,1,26,14,1,26,14,1,25,14,1,25,14,1,24,14,1,24,14,1,23,14,1,23,14,1,22,14,1,22,14,1,21,14,1,21,14,1,20,14,1,20,14,1,19,14,1,19,14,1,18,14,1,18,14,1,17,14,1,17,14,1,16,14,1,16,14], "i8", ALLOC_NONE, 5254620);
allocate([11,2,13,10,2,13,6,3,13,4,4,13,3,5,13,2,7,13,2,6,13,1,15,13,1,14,13,1,13,13,1,12,13,27,1,13,26,1,13,25,1,13,24,1,13,23,1,13,1,11,12,1,11,12,9,2,12,9,2,12,5,3,12,5,3,12,1,10,12,1,10,12,3,4,12,3,4,12,8,2,12,8,2,12,22,1,12,22,1,12,21,1,12,21,1,12,1,9,12,1,9,12,20,1,12,20,1,12,19,1,12,19,1,12,2,5,12,2,5,12,4,3,12,4,3,12,1,8,12,1,8,12,7,2,12,7,2,12,18,1,12,18,1,12], "i8", ALLOC_NONE, 5254764);
allocate([0,0,0,9,57,9,54,9,55,9,59,9,61,9,62,9,23,8,23,8,27,8,27,8,29,8,29,8,30,8,30,8,39,8,39,8,43,8,43,8,45,8,45,8,46,8,46,8,25,8,25,8,22,8,22,8,41,8,41,8,38,8,38,8,53,8,53,8,58,8,58,8,51,8,51,8,60,8,60,8,21,8,21,8,26,8,26,8,19,8,19,8,28,8,28,8,37,8,37,8,42,8,42,8,35,8,35,8,44,8,44,8,49,8,49,8,50,8,50,8,52,8,52,8,56,8,56,8], "i8", ALLOC_NONE, 5254908);
allocate([17,7,18,7,20,7,24,7,33,7,34,7,36,7,40,7,63,6,63,6,48,6,48,6,9,6,9,6,6,6,6,6,31,5,31,5,31,5,31,5,16,5,16,5,16,5,16,5,47,5,47,5,47,5,47,5,32,5,32,5,32,5,32,5,7,5,7,5,7,5,7,5,11,5,11,5,11,5,11,5,13,5,13,5,13,5,13,5,14,5,14,5,14,5,14,5,5,5,5,5,5,5,5,5,10,5,10,5,10,5,10,5,3,5,3,5,3,5,3,5,12,5,12,5,12,5,12,5,1,4,1,4,1,4,1,4,1,4,1,4,1,4,1,4,2,4,2,4,2,4,2,4,2,4,2,4,2,4,2,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,8,4,8,4,8,4,8,4,8,4,8,4,8,4,8,4,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3,15,3], "i8", ALLOC_NONE, 5255036);
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  var ___dirent_struct_layout={__size__:1040,d_ino:0,d_name:4,d_off:1028,d_reclen:1032,d_type:1036};function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      // NOTE: This implementation tries to mimic glibc rather than strictly
      // following the POSIX standard.
      var mode = HEAP32[((varargs)>>2)];
      // Simplify flags.
      var accessMode = oflag & 3;
      var isWrite = accessMode != 0;
      var isRead = accessMode != 1;
      var isCreate = Boolean(oflag & 512);
      var isExistCheck = Boolean(oflag & 2048);
      var isTruncate = Boolean(oflag & 1024);
      var isAppend = Boolean(oflag & 8);
      // Verify path.
      var origPath = path;
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists) {
        ___setErrNo(path.error);
        return -1;
      }
      var target = path.object || null;
      var finalPath;
      // Verify the file exists, create if needed and allowed.
      if (target) {
        if (isCreate && isExistCheck) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          return -1;
        }
        if ((isWrite || isCreate || isTruncate) && target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        }
        if (isRead && !target.read || isWrite && !target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        if (isTruncate && !target.isDevice) {
          target.contents = [];
        } else {
          if (!FS.forceLoadFile(target)) {
            ___setErrNo(ERRNO_CODES.EIO);
            return -1;
          }
        }
        finalPath = path.path;
      } else {
        if (!isCreate) {
          ___setErrNo(ERRNO_CODES.ENOENT);
          return -1;
        }
        if (!path.parentObject.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        target = FS.createDataFile(path.parentObject, path.name, [],
                                   mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
        finalPath = path.parentPath + '/' + path.name;
      }
      // Actually create an open stream.
      var id = FS.streams.length; // Keep dense
      if (target.isFolder) {
        var entryBuffer = 0;
        if (___dirent_struct_layout) {
          entryBuffer = _malloc(___dirent_struct_layout.__size__);
        }
        var contents = [];
        for (var key in target.contents) contents.push(key);
        FS.streams[id] = {
          path: finalPath,
          object: target,
          // An index into contents. Special values: -2 is ".", -1 is "..".
          position: -2,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: [],
          // Folder-specific properties:
          // Remember the contents at the time of opening in an array, so we can
          // seek between them relying on a single order.
          contents: contents,
          // Each stream has its own area for readdir() returns.
          currentEntry: entryBuffer
        };
      } else {
        FS.streams[id] = {
          path: finalPath,
          object: target,
          position: 0,
          isRead: isRead,
          isWrite: isWrite,
          isAppend: isAppend,
          error: false,
          eof: false,
          ungotten: []
        };
      }
      return id;
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead = 0;
        while (stream.ungotten.length && nbyte > 0) {
          HEAP8[((buf++)|0)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray) { // typed array
          HEAPU8.set(contents.subarray(offset, offset+size), buf);
        } else
        if (contents.slice) { // normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            while (stream.ungotten.length && nbyte > 0) {
              HEAP8[((buf++)|0)]=stream.ungotten.pop()
              nbyte--;
              bytesRead++;
            }
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[(((buf)+(i))|0)]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var ungotSize = stream.ungotten.length;
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          if (bytesRead != -1) {
            stream.position += (stream.ungotten.length - ungotSize) + bytesRead;
          }
          return bytesRead;
        }
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) return 0;
      var bytesRead = _read(stream, ptr, bytesToRead);
      var streamObj = FS.streams[stream];
      if (bytesRead == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        if (bytesRead < bytesToRead) streamObj.eof = true;
        return Math.floor(bytesRead / size);
      }
    }
var _present_frame; // stub for _present_frame
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  function _memcmp(p1, p2, num) {
      p1 = p1|0; p2 = p2|0; num = num|0;
      var i = 0, v1 = 0, v2 = 0;
      while ((i|0) < (num|0)) {
        var v1 = HEAPU8[(((p1)+(i))|0)];
        var v2 = HEAPU8[(((p2)+(i))|0)];
        if ((v1|0) != (v2|0)) return ((v1|0) > (v2|0) ? 1 : -1)|0;
        i = (i+1)|0;
      }
      return 0;
    }
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]|0 != 0) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(-3)];
          return ret;
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200) {
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var FUNCTION_TABLE = [0,0,_mpeg2_idct_add_c,0,_rgb_c_24_bgr_420,0,_motion_fr_dmv_422,0,_rgb_c_24_bgr_422,0,_rgb_c_24_rgb_420
,0,_sequence_ext,0,_rgb_c_16_444,0,_motion_fr_dmv_420,0,_motion_mp1,0,_mpeg2_header_gop
,0,_MC_avg_x_8_c,0,_rgb_c_24_bgr_444,0,_MC_avg_o_16_c,0,_MC_put_y_8_c,0,_rgb_c_16_422
,0,_rgb_c_16_420,0,_mpeg2_header_picture_start,0,_motion_fi_dmv_422,0,_motion_fr_frame_420,0,_MC_avg_o_8_c
,0,_motion_fr_frame_422,0,_picture_coding_ext,0,_copyright_ext,0,_rgb_c_8_444,0,_motion_fr_field_422
,0,_MC_put_x_16_c,0,_MC_put_x_8_c,0,_mpeg2convert_rgb32,0,_mpeg2_header_picture,0,_mpeg2_header_sequence
,0,_MC_avg_xy_16_c,0,_motion_fi_dmv_444,0,_seek_sequence,0,_rgb_c_8_420,0,_mpeg2_header_end
,0,_rgb_c_8_422,0,_MC_avg_y_16_c,0,_MC_put_y_16_c,0,_rgb_c_24_rgb_422,0,_MC_avg_xy_8_c
,0,_motion_fi_field_420,0,_rgb_c_32_420,0,_rgb_c_32_422,0,_mpeg2_header_user_data,0,_motion_fi_dmv_420
,0,_motion_fr_field_420,0,_MC_put_xy_16_c,0,_MC_avg_x_16_c,0,_MC_avg_y_8_c,0,_mpeg2_seek_header
,0,_rgb_c_24_rgb_444,0,_motion_fr_field_444,0,_rgb_c_32_444,0,_motion_fr_dmv_444,0,_motion_fi_field_422
,0,_mpeg2_parse_header,0,_motion_zero_420,0,_motion_zero_444,0,_MC_put_xy_8_c,0,_mpeg2_header_slice_start
,0,_seek_chunk,0,_MC_put_o_16_c,0,_motion_reuse_422,0,_MC_put_o_8_c,0,_motion_reuse_420
,0,_rgb_start,0,_quant_matrix_ext,0,_picture_display_ext,0,_motion_fi_16x8_444,0,_sequence_display_ext
,0,_motion_fr_frame_444,0,_mpeg2_idct_copy_c,0,_motion_fi_field_444,0,_motion_reuse_444,0,_invalid_end_action,0,_motion_zero_422,0,_mpeg2_header_extension,0,_motion_fi_16x8_422,0,_motion_fi_16x8_420,0];
// EMSCRIPTEN_START_FUNCS
function _seek_chunk(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=0;r3=HEAP32[r1+17508>>2];r4=(r1+17504|0)>>2;r5=HEAP32[r4];r6=r5;r7=r3-r6|0;do{if((r3|0)==(r5|0)){r2=6}else{r8=(r1+16940|0)>>2;r9=r5+r7|0;r10=r5;r11=HEAP32[r8];while(1){r12=r10+1|0;if((r11|0)==256){break}r13=(HEAPU8[r10]|r11)<<8;if(r12>>>0<r9>>>0){r10=r12;r11=r13}else{r2=5;break}}if(r2==5){HEAP32[r8]=r13;HEAP32[r4]=r12;r2=6;break}HEAP32[r8]=-256;HEAP32[r4]=r12;r11=r1+16996|0;r9=HEAP32[r11>>2];if((r12|0)==(r5|0)){r14=r11;r15=r9;break}HEAP32[r11>>2]=r12-r6+r9|0;HEAP8[r1+16972|0]=HEAP8[r10];r16=-1;return r16}}while(0);if(r2==6){r2=r1+16996|0;r14=r2;r15=HEAP32[r2>>2]}HEAP32[r14>>2]=r15+r7|0;r16=0;return r16}function _init(r1){var r2;HEAP32[1313047]=_mpeg2_init();r2=_fopen(r1,5252192);HEAP32[1310720]=r2;return((r2|0)==0)<<31>>31}function _decode_frame(){var r1,r2,r3,r4,r5,r6,r7,r8,r9;r1=0;r2=STACKTOP;STACKTOP=STACKTOP+4096|0;r3=r2;r4=HEAP32[1313047];r5=r3|0;r6=r3+4096|0;r3=r4;while(1){r7=_mpeg2_parse(r3);if((r7|0)==7|(r7|0)==8|(r7|0)==10){r1=20;break}else if((r7|0)==0){if((_fread(r5,1,4096,HEAP32[1310720])|0)==0){r8=-1;r1=24;break}r9=HEAP32[1313047];HEAP32[r9+17504>>2]=r5;HEAP32[r9+17508>>2]=r6}else if((r7|0)==1){r9=HEAP32[1313047]>>2;HEAP32[r9+4371]=56;HEAP32[r9+4372]=0;HEAP32[r9+4373]=11952;HEAP32[r9+4374]=0}else if((r7|0)==9){r8=-2;r1=23;break}r3=HEAP32[1313047]}if(r1==20){r3=HEAP32[r4+16896>>2];_present_frame(HEAP32[r3>>2],HEAP32[r3+4>>2],HEAP32[HEAP32[r4+16924>>2]>>2]);r8=0;STACKTOP=r2;return r8}else if(r1==23){STACKTOP=r2;return r8}else if(r1==24){STACKTOP=r2;return r8}}function _mpeg2_seek_header(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=0;r3=r1+16972|0;r4=r1+17508|0;r5=(r1+17504|0)>>2;r6=(r1+16940|0)>>2;r7=(r1+16996|0)>>2;r8=r1+17080|0;r9=HEAP8[r3];L30:while(1){if(r9<<24>>24==-77){r2=37;break}else if(r9<<24>>24==-73|r9<<24>>24==-72|r9<<24>>24==0){if((HEAP32[r8>>2]|0)!=-1){r2=37;break}}r10=HEAP32[r4>>2];r11=HEAP32[r5];r12=r11;r13=r10-r12|0;if((r10|0)==(r11|0)){r2=33;break}r10=r11+r13|0;r14=r11;r15=HEAP32[r6];while(1){r16=r14+1|0;if((r15|0)==256){break}r17=(HEAPU8[r14]|r15)<<8;if(r16>>>0<r10>>>0){r14=r16;r15=r17}else{r2=32;break L30}}HEAP32[r6]=-256;HEAP32[r5]=r16;r15=HEAP32[r7];if((r16|0)==(r11|0)){r18=r15;break}HEAP32[r7]=r16-r12+r15|0;r15=HEAP8[r14];HEAP8[r3]=r15;r9=r15}do{if(r2==37){r3=HEAP32[r1+16960>>2];HEAP32[r1+16968>>2]=r3;HEAP32[r1+16964>>2]=r3;HEAP32[r1+17016>>2]=0;if(r9<<24>>24!=0){r19=_mpeg2_parse_header(r1);return r19}r3=r1+16952|0;HEAP32[r3>>2]=(HEAP32[r3>>2]|0)!=5?4:6;r3=(r1+17172|0)>>2;HEAP32[r3]=0;r4=(r1+17168|0)>>2;HEAP32[r4]=0;r8=(r1+17164|0)>>2;HEAP32[r8]=0;r15=(r1+16992|0)>>2;r10=HEAP32[r15];do{if((r10|0)!=0){if((HEAP32[r7]|0)>3){HEAP32[r15]=0;HEAP32[r8]=HEAP32[r1+16976>>2];HEAP32[r4]=HEAP32[r1+16980>>2];HEAP32[r3]=128;break}if((r10|0)<=1){break}HEAP32[r15]=1;HEAP32[r8]=HEAP32[r1+16984>>2];HEAP32[r4]=HEAP32[r1+16988>>2];HEAP32[r3]=128}}while(0);r3=HEAP16[r1+17512>>1]<<16>>16;HEAP32[r1+17192>>2]=r3;HEAP32[r1+17184>>2]=r3;HEAP32[r1+17176>>2]=r3;r3=HEAP16[r1+17514>>1]<<16>>16;HEAP32[r1+17196>>2]=r3;HEAP32[r1+17188>>2]=r3;HEAP32[r1+17180>>2]=r3;r19=_mpeg2_parse_header(r1);return r19}else if(r2==32){HEAP32[r6]=r17;HEAP32[r5]=r16;r2=33;break}}while(0);if(r2==33){r18=HEAP32[r7]}HEAP32[r7]=r18+r13|0;r19=0;return r19}function _mpeg2_parse_header(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r2=0;r3=(r1+16948|0)>>2;HEAP32[r3]=112;r4=r1+16932|0;HEAP32[r4>>2]=0;r5=r1+16936|0;HEAP32[r5>>2]=0;r6=r1+17508|0;r7=(r1+17504|0)>>2;r8=(r1+16960|0)>>2;r9=(r1+16968|0)>>2;r10=(r1+16940|0)>>2;r11=(r1+16996|0)>>2;r12=r1+16972|0;r13=r1+16952|0;r14=r1+16964|0;r15=HEAP32[r7];r16=HEAP32[r9];L61:while(1){r17=HEAP32[r6>>2];r18=r17-r15|0;r19=HEAP32[r8]+1222656|0;r20=r19-r16|0;if((r18|0)>(r20|0)){if((r19|0)==(r16|0)){r2=66;break}r19=r15+r20|0;r21=r15;r22=HEAP32[r10];r23=r16;while(1){r24=r21+1|0;r25=HEAP8[r21];if((r22|0)==256){break}r26=(r25&255|r22)<<8;HEAP8[r23]=r25;if(r24>>>0<r19>>>0){r21=r24;r22=r26;r23=r23+1|0}else{r2=63;break L61}}HEAP32[r10]=-256;HEAP32[r9]=r23+1|0;r22=HEAP32[r7];HEAP32[r7]=r24;if((r24|0)==(r22|0)){r2=66;break}r27=r24-r22|0}else{if((r17|0)==(r15|0)){r28=r16;r2=58;break}r22=r15+r18|0;r21=r15;r19=r16;r25=HEAP32[r10];while(1){r29=r21+1|0;r30=HEAP8[r21];if((r25|0)==256){break}r31=(r30&255|r25)<<8;HEAP8[r19]=r30;if(r29>>>0<r22>>>0){r21=r29;r19=r19+1|0;r25=r31}else{r2=55;break L61}}HEAP32[r10]=-256;r25=r19+1|0;HEAP32[r9]=r25;r21=HEAP32[r7];HEAP32[r7]=r29;if((r29|0)==(r21|0)){r28=r25;r2=58;break}r27=r29-r21|0}HEAP32[r11]=HEAP32[r11]+r27|0;r21=(FUNCTION_TABLE[HEAP32[((HEAP8[r12]&11)<<2)+5243200>>2]](r1)|0)==0;r25=HEAP32[r7];r22=HEAP8[r25-1|0];HEAP8[r12]=r22;if(!r21){r2=68;break}r21=HEAP32[r13>>2]<<8|r22&255;if((r21|0)==256){r2=70;break}else if((r21|0)==440){r2=71;break}else if((r21|0)==768){r2=72;break}else if((r21|0)==1025|(r21|0)==1537){r2=75;break}else if(!((r21|0)==434|(r21|0)==946|(r21|0)==1202|(r21|0)==1714|(r21|0)==437|(r21|0)==1205|(r21|0)==1717)){r2=77;break}r21=HEAP32[r14>>2];HEAP32[r9]=r21;r15=r25;r16=r21}do{if(r2==68){HEAP32[r3]=100;r32=9;return r32}else if(r2==70){HEAP32[r3]=34;r2=71;break}else if(r2==55){HEAP32[r10]=r31;HEAP32[r7]=r29;r28=HEAP32[r9];r2=58;break}else if(r2==63){HEAP32[r10]=r26;HEAP32[r7]=r24;r2=66;break}else if(r2==77){HEAP32[r3]=100;r32=9;return r32}else if(r2==72){r16=r1+17148|0;r15=r1+17140|0;r27=r16;r6=HEAP32[r15+4>>2];HEAP32[r27>>2]=HEAP32[r15>>2];HEAP32[r27+4>>2]=r6;r6=(r1+16904|0)>>2;HEAP32[r6]=0;HEAP32[r6+1]=0;HEAP32[r6+2]=0;HEAP32[r6+3]=0;HEAP32[r6+4]=0;HEAP32[r6+5]=0;HEAP32[r6+6]=0;HEAP32[r1+16900>>2]=r16;r16=HEAP32[r1+17016>>2];if((r16|0)!=0){HEAP32[r4>>2]=HEAP32[r8];HEAP32[r5>>2]=r16-3|0}HEAP32[r3]=34;break}else if(r2==75){_mpeg2_header_picture_finalize(r1,HEAP32[1312854]);HEAP32[r3]=120;break}}while(0);if(r2==66){HEAP32[r11]=HEAP32[r11]+r20|0;HEAP8[r12]=-76;HEAP32[r3]=100;r32=9;return r32}else if(r2==58){HEAP32[r11]=HEAP32[r11]+r18|0;HEAP32[r9]=r28+r18|0;r32=0;return r32}else if(r2==71){_mpeg2_header_sequence_finalize(r1)}r2=HEAP32[r8];HEAP32[r9]=r2;HEAP32[r14>>2]=r2;HEAP32[r1+17016>>2]=0;r32=HEAP32[r13>>2];return r32}function _mpeg2_parse(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r3=(r1+16948|0)>>2;r4=HEAP32[r3];do{if((r4|0)!=0){r5=FUNCTION_TABLE[r4](r1);if((r5|0)>-1){r6=r5}else{break}return r6}}while(0);r4=r1+16972|0;r5=r1+17012|0;r7=r1+17013|0;r8=r1+17508|0;r9=(r1+17504|0)>>2;r10=r1+16960|0;r11=(r1+16968|0)>>2;r12=(r1+16940|0)>>2;r13=(r1+16996|0)>>2;r14=r1|0;r15=r1+16964|0;r16=HEAP8[r4];L107:while(1){r17=r16&255;if((r17-HEAPU8[r5]|0)>>>0>=HEAPU8[r7]>>>0){if((r17-1|0)>>>0>174){r2=117;break}r18=HEAP32[r8>>2];r19=HEAP32[r9];r20=r19;r21=r18-r20|0;if((r18|0)==(r19|0)){r2=113;break}r18=r19+r21|0;r22=r19;r23=HEAP32[r12];while(1){r24=r22+1|0;if((r23|0)==256){break}r25=(HEAPU8[r22]|r23)<<8;if(r24>>>0<r18>>>0){r22=r24;r23=r25}else{r2=112;break L107}}HEAP32[r12]=-256;HEAP32[r9]=r24;r23=HEAP32[r13];if((r24|0)==(r19|0)){r26=r23;break}HEAP32[r13]=r24-r20+r23|0;r23=HEAP8[r22];HEAP8[r4]=r23;r16=r23;continue}r23=HEAP32[r8>>2];r18=HEAP32[r9];r27=r23-r18|0;r28=HEAP32[r10>>2]+1222656|0;r29=HEAP32[r11];r30=r28-r29|0;if((r27|0)>(r30|0)){if((r28|0)==(r29|0)){r2=105;break}r28=r18+r30|0;r31=r18;r32=HEAP32[r12];r33=r29;while(1){r34=r31+1|0;r35=HEAP8[r31];if((r32|0)==256){break}r36=(r35&255|r32)<<8;HEAP8[r33]=r35;if(r34>>>0<r28>>>0){r31=r34;r32=r36;r33=r33+1|0}else{r2=102;break L107}}HEAP32[r12]=-256;HEAP32[r11]=r33+1|0;r32=HEAP32[r9];HEAP32[r9]=r34;if((r34|0)==(r32|0)){r2=105;break}r37=r34-r32|0}else{if((r23|0)==(r18|0)){r38=r29;r2=97;break}r32=r18+r27|0;r31=r29;r28=HEAP32[r12];r22=r18;while(1){r39=r22+1|0;r20=HEAP8[r22];if((r28|0)==256){break}r40=(r20&255|r28)<<8;HEAP8[r31]=r20;if(r39>>>0<r32>>>0){r31=r31+1|0;r28=r40;r22=r39}else{r2=94;break L107}}HEAP32[r12]=-256;r22=r31+1|0;HEAP32[r11]=r22;r28=HEAP32[r9];HEAP32[r9]=r39;if((r39|0)==(r28|0)){r38=r22;r2=97;break}r37=r39-r28|0}HEAP32[r13]=HEAP32[r13]+r37|0;_mpeg2_slice(r14,HEAPU8[r4],HEAP32[r15>>2]);r28=HEAP8[HEAP32[r9]-1|0];HEAP8[r4]=r28;HEAP32[r11]=HEAP32[r15>>2];r16=r28}do{if(r2==117){if((r17|0)==0){HEAP32[r3]=34;r6=HEAP32[r1+16952>>2];return r6}else if((r17|0)==179|(r17|0)==184){r41=112}else if((r17|0)==183){r41=70}else{HEAP32[r3]=122;r6=9;return r6}HEAP32[r3]=r41;r6=(HEAP32[r1+16952>>2]|0)==7?7:9;return r6}else if(r2==112){HEAP32[r12]=r25;HEAP32[r9]=r24;r2=113;break}else if(r2==94){HEAP32[r12]=r40;HEAP32[r9]=r39;r38=HEAP32[r11];r2=97;break}else if(r2==102){HEAP32[r12]=r36;HEAP32[r9]=r34;r2=105;break}}while(0);if(r2==113){r26=HEAP32[r13]}else if(r2==97){HEAP32[r13]=HEAP32[r13]+r27|0;HEAP32[r11]=r38+r27|0;r6=0;return r6}else if(r2==105){HEAP32[r13]=HEAP32[r13]+r30|0;HEAP32[r3]=122;r6=9;return r6}HEAP32[r13]=r26+r21|0;r6=0;return r6}function _mpeg2_init(){var r1,r2,r3,r4,r5,r6,r7,r8,r9;r1=0;if((HEAP32[1312854]|0)==0){HEAP32[1312854]=-2147483648;HEAP32[1310841]=144;HEAP32[1310842]=2;r2=-3840;while(1){if((r2|0)<0){r3=0}else{r3=(r2|0)>255?-1:r2&255}HEAP8[r2+5247320|0]=r3;r4=r2+1|0;if((r4|0)==4096){r5=0;break}else{r2=r4}}while(1){r2=r5+5243072|0;r3=HEAP8[r2];HEAP8[r2]=(r3&255)>>>1&27|r3<<2&36;r3=r5+5243136|0;r2=HEAP8[r3];HEAP8[r3]=(r2&255)>>>1&27|r2<<2&36;r2=r5+1|0;if((r2|0)==64){break}else{r5=r2}}_memcpy(5243300,5243236,64)}r5=HEAP32[1312861];do{if((r5|0)==0){r1=139}else{r2=FUNCTION_TABLE[r5](18048,0);if((r2|0)==0){r1=139;break}else{r6=r2,r7=r6>>2;break}}}while(0);do{if(r1==139){r5=_malloc(18115);if((r5|0)==0){r8=0;return r8}r2=67-(r5+67&63)|0;r3=r5+r2|0;HEAP32[r5+(r2-4)>>2]=r5;if((r3|0)==0){r8=0}else{r6=r3,r7=r6>>2;break}return r8}}while(0);r3=r6;r5=(r6+256|0)>>2;HEAP32[r5]=0;HEAP32[r5+1]=0;HEAP32[r5+2]=0;HEAP32[r5+3]=0;HEAP32[r5+4]=0;HEAP32[r5+5]=0;HEAP32[r5+6]=0;HEAP32[r5+7]=0;HEAP32[r5+8]=0;HEAP32[r5+9]=0;HEAP32[r5+10]=0;HEAP32[r5+11]=0;HEAP32[r5+12]=0;HEAP32[r5+13]=0;HEAP32[r5+14]=0;HEAP32[r5+15]=0;HEAP32[r5+16]=0;HEAP32[r5+17]=0;HEAP32[r5+18]=0;HEAP32[r5+19]=0;HEAP32[r5+20]=0;HEAP32[r5+21]=0;HEAP32[r5+22]=0;HEAP32[r5+23]=0;HEAP32[r5+24]=0;HEAP32[r5+25]=0;HEAP32[r5+26]=0;HEAP32[r5+27]=0;HEAP32[r5+28]=0;HEAP32[r5+29]=0;HEAP32[r5+30]=0;HEAP32[r5+31]=0;_memset(r6+17525|0,0,256);r5=HEAP32[1312861];do{if((r5|0)==0){r1=143}else{r2=FUNCTION_TABLE[r5](1222660,1);if((r2|0)==0){r1=143;break}else{r9=r2;break}}}while(0);do{if(r1==143){r5=_malloc(1222727);if((r5|0)==0){r9=0;break}r2=67-(r5+67&63)|0;HEAP32[r5+(r2-4)>>2]=r5;r9=r5+r2|0}}while(0);HEAP32[r7+4240]=r9;HEAP32[r7+4270]=-1;HEAP32[r7+4377]=0;HEAP32[r7+4376]=0;HEAP32[r7+4248]=0;HEAP32[r7+4235]=-256;HEAP8[r6+16972|0]=-76;HEAP32[r7+4237]=100;HEAP32[r7+4238]=9;HEAP32[r7+4250]=1;_memset(r6+16896|0,0,44);_mpeg2_header_state_init(r3);r8=r3;return r8}function _mpeg2_header_state_init(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=r1>>2;r3=0;r4=r1+17080|0;do{if((HEAP32[r4>>2]|0)==-1){r5=r1+400|0;r6=r1+17500|0;r7=r1+17440|0}else{HEAP32[r4>>2]=-1;r8=r1+17440|0;L188:do{if((HEAP32[r8>>2]|0)==0){r9=HEAP32[r2+4251];r10=r1+17008|0;if((r9|0)<(HEAP32[r10>>2]|0)){r11=r9}else{break}while(1){r9=HEAP32[((r11<<4)+17392>>2)+r2];r12=HEAP32[1312862];do{if((r12|0)==0){if((r9|0)==0){break}else{r3=157;break}}else{if((FUNCTION_TABLE[r12](r9)|0)==0&(r9|0)!=0){r3=157;break}else{break}}}while(0);if(r3==157){r3=0;_free(HEAP32[r9-4>>2])}r12=HEAP32[((r11<<4)+17396>>2)+r2];r13=HEAP32[1312862];do{if((r13|0)==0){if((r12|0)==0){break}else{r3=161;break}}else{if((FUNCTION_TABLE[r13](r12)|0)==0&(r12|0)!=0){r3=161;break}else{break}}}while(0);if(r3==161){r3=0;_free(HEAP32[r12-4>>2])}r13=HEAP32[((r11<<4)+17400>>2)+r2];r9=HEAP32[1312862];do{if((r9|0)==0){if((r13|0)==0){break}else{r3=165;break}}else{if((FUNCTION_TABLE[r9](r13)|0)==0&(r13|0)!=0){r3=165;break}else{break}}}while(0);if(r3==165){r3=0;_free(HEAP32[r13-4>>2])}r9=r11+1|0;if((r9|0)<(HEAP32[r10>>2]|0)){r11=r9}else{break L188}}}}while(0);r10=r1+17500|0;L211:do{if((HEAP32[r10>>2]|0)!=0){r9=0;while(1){r12=HEAP32[((r9*12&-1)+17444>>2)+r2];r14=HEAP32[1312862];do{if((r14|0)==0){if((r12|0)==0){break}else{r3=171;break}}else{if((FUNCTION_TABLE[r14](r12)|0)==0&(r12|0)!=0){r3=171;break}else{break}}}while(0);if(r3==171){r3=0;_free(HEAP32[r12-4>>2])}r14=HEAP32[((r9*12&-1)+17448>>2)+r2];r13=HEAP32[1312862];do{if((r13|0)==0){if((r14|0)==0){break}else{r3=175;break}}else{if((FUNCTION_TABLE[r13](r14)|0)==0&(r14|0)!=0){r3=175;break}else{break}}}while(0);if(r3==175){r3=0;_free(HEAP32[r14-4>>2])}r13=HEAP32[((r9*12&-1)+17452>>2)+r2];r12=HEAP32[1312862];do{if((r12|0)==0){if((r13|0)==0){break}else{r3=179;break}}else{if((FUNCTION_TABLE[r12](r13)|0)==0&(r13|0)!=0){r3=179;break}else{break}}}while(0);if(r3==179){r3=0;_free(HEAP32[r13-4>>2])}r12=r9+1|0;if((r12|0)==3){break L211}else{r9=r12}}}}while(0);r9=r1+400|0;r12=HEAP32[r9>>2];if((r12|0)==0){r5=r9;r6=r10;r7=r8;break}r14=HEAP32[1312862];if((r14|0)!=0){if((FUNCTION_TABLE[r14](r12)|0)!=0){r5=r9;r6=r10;r7=r8;break}}_free(HEAP32[r12-4>>2]);r5=r9;r6=r10;r7=r8}}while(0);HEAP32[r2+4209]=1;HEAP32[r2+99]=0;HEAP32[r5>>2]=0;HEAP32[r2+4344]=r1+17200|0;HEAP32[r2+4345]=r1+17392|0;HEAP32[r2+4346]=r1+17408|0;HEAP32[r2+4347]=r1+17424|0;HEAP32[r2+4250]=1;HEAP32[r2+4252]=0;HEAP32[r2+4251]=0;HEAP8[r1+17012|0]=1;HEAP8[r1+17013|0]=-81;HEAP32[r2+4371]=0;HEAP32[r6>>2]=0;HEAP32[r7>>2]=0;HEAP32[r2+4370]=0;return}function _mpeg2_header_sequence(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=HEAP32[r1+16964>>2];r3=r2+6|0;if((HEAP8[r3]&32)<<24>>24==0){r4=1;return r4}r5=HEAPU8[r2+1|0]<<8;r6=HEAP8[r2+2|0];r7=(r5|HEAPU8[r2]<<16)>>>12;HEAP32[r1+17048>>2]=r7;HEAP32[r1+17056>>2]=r7;if((r7|0)==0){r4=1;return r4}r8=r5&3840|r6&255;HEAP32[r1+17052>>2]=r8;HEAP32[r1+17060>>2]=r8;if((r8|0)==0){r4=1;return r4}r6=r7+15&8176;HEAP32[r1+17020>>2]=r6;r7=r8+15&8176;HEAP32[r1+17024>>2]=r7;HEAP32[r1+17028>>2]=r6>>>1;HEAP32[r1+17032>>2]=r7>>>1;r7=r1+17044|0;HEAP32[r7>>2]=164;r6=r2+3|0;HEAP32[r1+17064>>2]=HEAPU8[r6]>>>4;HEAP32[r1+17072>>2]=HEAP32[((HEAP8[r6]&15)<<2)+5243372>>2];HEAP32[r1+17036>>2]=HEAPU8[r2+5|0]<<2|HEAPU8[r2+4|0]<<10|HEAPU8[r3]>>>6;r6=r2+7|0;HEAP32[r1+17040>>2]=(HEAPU8[r6]<<8|HEAPU8[r3]<<16)&2095104;if((HEAP8[r6]&4)<<24>>24!=0){HEAP32[r7>>2]=166}HEAP32[r1+17516>>2]=3;r7=HEAP8[r6];L251:do{if((r7&2)<<24>>24==0){r6=0;while(1){HEAP8[HEAPU8[r6+5243072|0]+r1+17781|0]=HEAP8[r6+5252124|0];r3=r6+1|0;if((r3|0)==64){r9=r2;break L251}else{r6=r3}}}else{r6=0;r3=r7;while(1){r8=r6+(r2+8)|0;HEAP8[HEAPU8[r6+5243072|0]+r1+17781|0]=HEAPU8[r8]>>>1|r3<<7;r5=r6+1|0;if((r5|0)==64){break}r6=r5;r3=HEAP8[r8]}r9=r2+64|0}}while(0);L259:do{if((HEAP8[r9+7|0]&1)<<24>>24==0){_memset(r1+17845|0,16,64)}else{r2=0;while(1){HEAP8[HEAPU8[r2+5243072|0]+r1+17845|0]=HEAP8[r2+(r9+8)|0];r7=r2+1|0;if((r7|0)==64){break L259}else{r2=r7}}}}while(0);HEAP8[r1+17076|0]=-128;HEAP8[r1+17077|0]=0;HEAP8[r1+17078|0]=0;HEAP8[r1+17079|0]=0;HEAP32[r1+16956>>2]=2;HEAP32[r1+16952>>2]=1;HEAP16[r1+17514>>1]=0;HEAP16[r1+17512>>1]=0;r4=0;return r4}function _mpeg2_header_sequence_finalize(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r2=r1>>2;r3=0;r4=r1+17020|0;r5=(r1+17036|0)>>2;r6=HEAP32[r5]*50&-1;HEAP32[r5]=r6;r7=r1+17044|0;do{if((HEAP32[r7>>2]&1|0)==0){if((r6|0)==13107150){HEAP32[r5]=0}r8=(r1+17064|0)>>2;r9=HEAP32[r8];if((r9|0)==0|(r9|0)==15){HEAP32[r2+4267]=0;HEAP32[r8]=0;break}else if((r9|0)==1){HEAP32[r2+4267]=1;HEAP32[r8]=1;break}else if((r9|0)==3){HEAP32[r8]=64;HEAP32[r2+4267]=45;break}else if((r9|0)==6){HEAP32[r8]=32;HEAP32[r2+4267]=27;break}else if((r9|0)==12){HEAP32[r8]=8;HEAP32[r2+4267]=9;break}else{r8=(r9*88&-1)+1171|0;r9=r1+17064|0;HEAP32[r9>>2]=2e3;r10=r1+17068|0;HEAP32[r10>>2]=r8;r11=r8;r12=2e3;r13=r9;r14=r10;r3=221;break}}else{r10=(r1+17064|0)>>2;r9=HEAP32[r10];if((r9|0)==1){HEAP32[r2+4267]=1;HEAP32[r10]=1;break}else if((r9|0)==2){r15=4;r16=3}else if((r9|0)==3){r15=16;r16=9}else if((r9|0)==4){r15=221;r16=100}else{HEAP32[r2+4267]=0;HEAP32[r10]=0;break}r10=Math.imul(HEAP32[r2+4265],r15);r9=Math.imul(HEAP32[r2+4264],r16);r8=r1+17064|0;HEAP32[r8>>2]=r10;r17=r1+17068|0;HEAP32[r17>>2]=r9;if((r10|0)==0){r18=r9;r19=r9;r20=0;r21=r8;r22=r17;r3=223;break}else{r11=r9;r12=r10;r13=r8;r14=r17;r3=221;break}}}while(0);L285:do{if(r3==221){r16=r11;r15=r12;while(1){r6=(r16|0)%(r15|0);if((r6|0)==0){r18=r15;r19=r11;r20=r12;r21=r13;r22=r14;r3=223;break L285}else{r16=r15;r15=r6}}}}while(0);if(r3==223){HEAP32[r21>>2]=Math.floor((r20>>>0)/(r18>>>0));HEAP32[r22>>2]=Math.floor((r19>>>0)/(r18>>>0))}_finalize_matrix(r1);HEAP32[r2+4218]=HEAP32[r7>>2]&1^1;r7=HEAP32[r4>>2];HEAP32[r2+4205]=r7;r18=HEAP32[r2+4256];HEAP32[r2+4206]=r18;HEAP32[r2+4207]=HEAP32[r2+4263]>>>0>2800&1;HEAP32[r2+4208]=((HEAP32[r2+4258]|0)==(r18|0)&1)+((HEAP32[r2+4257]|0)==(r7|0)&1)|0;r18=r1+17080|0;do{if((HEAP32[r18>>2]|0)==-1){HEAP32[r2+11]=r7;r23=r18;r24=r4}else{r19=HEAP32[r5];HEAP32[r5]=HEAP32[r2+4274];r22=r18;r20=r4;if((_memcmp(r22,r20,60)|0)==0){HEAP32[r5]=r19;HEAP32[r2+4238]=2;r23=r22;r24=r20;break}HEAP32[r2+11]=r7;HEAP32[r5]=r19;r19=(HEAP32[r2+4209]|0)==3;r20=r19&1;r22=r1+17288|0;r21=HEAP32[r2+4344]>>>0>=r22>>>0^r19?r22:r1+17200|0;r22=(r1+16904|0)>>2;HEAP32[r22]=0;HEAP32[r22+1]=0;HEAP32[r22+2]=0;HEAP32[r22+3]=0;HEAP32[r22+4]=0;HEAP32[r22+5]=0;HEAP32[r22+6]=0;do{if((HEAP32[r2+4276]&8|0)==0){HEAP32[r2+4229]=r21;if((HEAP32[r21+4>>2]|0)==1){HEAP32[r2+4230]=r21+44|0}HEAP32[r2+4231]=HEAP32[((r20<<2)+17380>>2)+r2];if((HEAP32[r2+4371]|0)!=0){break}HEAP32[r2+4232]=HEAP32[(((r19?2:1)<<2)+17380>>2)+r2]}else{if((HEAP32[r2+4371]|0)!=0){break}HEAP32[r2+4232]=HEAP32[((r20<<2)+17380>>2)+r2]}}while(0);HEAP32[r2+4237]=150;HEAP32[r2+4238]=10;return}}while(0);_memcpy(r23,r24,60);r24=(r1+16904|0)>>2;HEAP32[r24]=0;HEAP32[r24+1]=0;HEAP32[r24+2]=0;HEAP32[r24+3]=0;HEAP32[r24+4]=0;HEAP32[r24+5]=0;HEAP32[r24+6]=0;HEAP32[r2+4224]=r18;HEAP32[r2+4225]=0;r18=HEAP32[r2+4254];if((r18|0)==0){return}HEAP32[r2+4233]=HEAP32[r2+4240];HEAP32[r2+4234]=r18-3|0;return}function _mpeg2_header_gop(r1){var r2,r3,r4,r5;r2=HEAP32[r1+16964>>2];r3=r2+1|0;if((HEAP8[r3]&8)<<24>>24==0){r4=1;return r4}HEAP8[r1+17140|0]=HEAPU8[r2]>>>2&31;HEAP8[r1+17141|0]=HEAP8[r2]<<4&48|HEAPU8[r3]>>>4;r5=r2+2|0;HEAP8[r1+17142|0]=HEAP8[r3]<<3&56|HEAPU8[r5]>>>5;r3=r2+3|0;HEAP8[r1+17143|0]=HEAP8[r5]<<1&62|HEAPU8[r3]>>>7;HEAP32[r1+17144>>2]=HEAPU8[r3]>>>4&6|HEAPU8[r2]>>>7;HEAP32[r1+16952>>2]=3;r4=0;return r4}function _mpeg2_header_picture(r1){var r2,r3,r4,r5;r2=r1>>2;r3=HEAP32[r2+4241];r4=r3+1|0;r5=HEAPU8[r4]>>>3&7;HEAP32[r2+4239]=256;HEAP32[r2+4289]=HEAPU8[r4]>>>6|HEAPU8[r3]<<2;r4=r1+17172|0;HEAP32[r4>>2]=HEAP32[r4>>2]|r5;if((r5-2|0)>>>0<2){r5=r3+3|0;HEAP32[r2+43]=HEAPU8[r5]>>>2&1;r4=r3+4|0;HEAP32[r2+42]=(HEAPU8[r5]<<1&6|HEAPU8[r4]>>>7)-1|0;HEAP32[r2+29]=HEAPU8[r4]>>>6&1;HEAP32[r2+28]=(HEAPU8[r4]>>>3&7)-1|0}HEAP32[r2+4290]=2;HEAP8[r1+17520|0]=0;HEAP32[r2+4210]=7;HEAP32[r2+4212]=1;HEAP32[r2+4213]=0;HEAP32[r2+4216]=5243072;HEAP32[r2+4211]=3;HEAP32[r2+4379]=0;return 0}function _finalize_matrix(r1){var r2,r3,r4,r5,r6;r2=r1>>2;r3=0;r4=HEAP32[r2+4379];do{if((r4&1|0)!=0){r5=r1+17525|0;r6=r1+17781|0;if((_memcmp(r5,r6,64)|0)==0){break}_memcpy(r5,r6,64);HEAP8[r1+17521|0]=-1}}while(0);do{if((r4&4|0)==0){r3=258}else{r6=r1+17909|0;if((_memcmp(r1+17525|0,r6,64)|0)==0){r3=258;break}r5=r1+17653|0;if((_memcmp(r5,r6,64)|0)!=0){_memcpy(r5,r6,64);HEAP8[r1+17523|0]=-1}HEAP32[r2+107]=r1+8628|0;break}}while(0);do{if(r3==258){if((r4&5|0)==0){break}HEAP32[r2+107]=r1+436|0}}while(0);do{if((r4&2|0)!=0){r3=r1+17589|0;r6=r1+17845|0;if((_memcmp(r3,r6,64)|0)==0){break}_memcpy(r3,r6,64);HEAP8[r1+17522|0]=-1}}while(0);do{if((r4&8|0)!=0){r6=r1+17973|0;if((_memcmp(r1+17589|0,r6,64)|0)==0){break}r3=r1+17717|0;if((_memcmp(r3,r6,64)|0)!=0){_memcpy(r3,r6,64);HEAP8[r1+17524|0]=-1}HEAP32[r2+108]=r1+12724|0;return}}while(0);if((r4&10|0)==0){return}HEAP32[r2+108]=r1+4532|0;return}function _mpeg2_header_end(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1>>2;r3=(HEAP32[r2+4209]|0)==3;r4=r3&1;r5=r1+17288|0;r6=HEAP32[r2+4344]>>>0>=r5>>>0^r3?r5:r1+17200|0;r5=(r1+16904|0)>>2;HEAP32[r5]=0;HEAP32[r5+1]=0;HEAP32[r5+2]=0;HEAP32[r5+3]=0;HEAP32[r5+4]=0;HEAP32[r5+5]=0;HEAP32[r5+6]=0;if((HEAP32[r2+4276]&8|0)!=0){if((HEAP32[r2+4371]|0)!=0){r7=r1+16948|0,r8=r7>>2;HEAP32[r8]=66;return 8}HEAP32[r2+4232]=HEAP32[((r4<<2)+17380>>2)+r2];r7=r1+16948|0,r8=r7>>2;HEAP32[r8]=66;return 8}HEAP32[r2+4229]=r6;if((HEAP32[r6+4>>2]|0)==1){HEAP32[r2+4230]=r6+44|0}HEAP32[r2+4231]=HEAP32[((r4<<2)+17380>>2)+r2];if((HEAP32[r2+4371]|0)!=0){r7=r1+16948|0,r8=r7>>2;HEAP32[r8]=66;return 8}HEAP32[r2+4232]=HEAP32[(((r3?2:1)<<2)+17380>>2)+r2];r7=r1+16948|0,r8=r7>>2;HEAP32[r8]=66;return 8}function _invalid_end_action(r1){var r2,r3;r2=r1>>2;_memset(r1+16900|0,0,32);r3=HEAP32[r2+4254];if((r3|0)!=0){HEAP32[r2+4233]=HEAP32[r2+4240];HEAP32[r2+4234]=r3-3|0}_mpeg2_header_state_init(r1);_memcpy(r1+17080|0,r1+17020|0,60);HEAP32[r2+4237]=100;HEAP32[r2+4238]=1;return 1}function _mpeg2_header_picture_start(r1){var r2,r3,r4,r5,r6;r2=r1+16952|0;HEAP32[r2>>2]=(HEAP32[r2>>2]|0)!=5?4:6;r2=(r1+17172|0)>>2;HEAP32[r2]=0;r3=(r1+17168|0)>>2;HEAP32[r3]=0;r4=(r1+17164|0)>>2;HEAP32[r4]=0;r5=(r1+16992|0)>>2;r6=HEAP32[r5];do{if((r6|0)!=0){if((HEAP32[r1+16996>>2]|0)>3){HEAP32[r5]=0;HEAP32[r4]=HEAP32[r1+16976>>2];HEAP32[r3]=HEAP32[r1+16980>>2];HEAP32[r2]=128;break}if((r6|0)<=1){break}HEAP32[r5]=1;HEAP32[r4]=HEAP32[r1+16984>>2];HEAP32[r3]=HEAP32[r1+16988>>2];HEAP32[r2]=128}}while(0);r2=HEAP16[r1+17512>>1]<<16>>16;HEAP32[r1+17192>>2]=r2;HEAP32[r1+17184>>2]=r2;HEAP32[r1+17176>>2]=r2;r2=HEAP16[r1+17514>>1]<<16>>16;HEAP32[r1+17196>>2]=r2;HEAP32[r1+17188>>2]=r2;HEAP32[r1+17180>>2]=r2;return _mpeg2_parse_header(r1)}function _mpeg2_header_picture_finalize(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r3=r1>>2;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+24|0;r6=r5;r7=(r1+16836|0)>>2;r8=(HEAP32[r7]|0)==3;r9=r1+17080|0;r10=(r1+17104|0)>>2;r11=HEAP32[r10]&8;_finalize_matrix(r1);r12=r1+17156|0;r13=HEAP32[r3+4293]&7;HEAP32[r7]=r13;r14=r1+16868|0;L381:do{if((HEAP32[r3+4238]|0)==4){HEAP32[r14>>2]=0;r15=r1+17200|0;r16=r1+17376|0;r17=r1+17288|0;r18=r8^HEAP32[r16>>2]>>>0<r17>>>0;r19=r18?r15:r17;r20=r18?r17:r15;HEAP32[r16>>2]=r20;_memcpy(r20,r12,44);if(r8){r16=r1+17380|0,r21=r16>>2}else{r15=r1+17384|0;HEAP32[r3+4347]=HEAP32[r15>>2];r17=r1+17380|0;HEAP32[r15>>2]=HEAP32[r17>>2];r16=r17,r21=r16>>2}HEAP32[r21]=0;r16=r1+16904|0;r17=r16>>2;HEAP32[r17]=0;HEAP32[r17+1]=0;HEAP32[r17+2]=0;HEAP32[r17+3]=0;HEAP32[r17+4]=0;HEAP32[r17+5]=0;HEAP32[r17+6]=0;HEAP32[r16>>2]=r20;r16=(r1+16916|0)>>2;HEAP32[r16]=r20;do{if((r13|0)==3){r22=HEAP32[r3+4371]}else{do{if((r11|0)==0){r20=r1+17e3|0;if((HEAP32[r20>>2]|0)!=0){HEAP32[r16]=0;HEAP32[r20>>2]=0;break}HEAP32[r16]=r19;if((HEAP32[r19+4>>2]|0)==1){HEAP32[r3+4230]=r19+44|0}HEAP32[r3+4231]=HEAP32[r3+4346]}}while(0);r20=HEAP32[r3+4371];r17=((r20|0)==0&1)+(r11>>>3^1)|0;if((r17|0)==0){r22=r20;break}HEAP32[r3+4232]=HEAP32[((r17<<2)+17380>>2)+r3];r22=r20}}while(0);r19=(r1+17484|0)>>2;if((r22|0)==0){if((HEAP32[r3+4360]|0)!=0){break}r16=(r1+17008|0)>>2;r20=HEAP32[r16];if((r20|0)<3){r17=r1+44|0;r15=r1+17084|0;r18=r1+16832|0;r23=r20;while(1){HEAP32[r16]=r23+1|0;HEAP32[((r23<<4)+17404>>2)+r3]=0;r20=Math.imul(HEAP32[r15>>2],HEAP32[r17>>2]);r24=r20>>2-HEAP32[r18>>2];r25=HEAP32[1312861];do{if((r25|0)==0){r4=397}else{r26=FUNCTION_TABLE[r25](r20,2);if((r26|0)==0){r4=397;break}else{r27=r26;break}}}while(0);do{if(r4==397){r4=0;if((r20|0)==0){r27=0;break}r25=_malloc(r20+67|0);if((r25|0)==0){r27=0;break}r26=67-(r25+67&63)|0;HEAP32[r25+(r26-4)>>2]=r25;r27=r25+r26|0}}while(0);HEAP32[((r23<<4)+17392>>2)+r3]=r27;r20=HEAP32[1312861];do{if((r20|0)==0){r4=402}else{r26=FUNCTION_TABLE[r20](r24,2);if((r26|0)==0){r4=402;break}else{r28=r26;break}}}while(0);do{if(r4==402){r4=0;if((r24|0)==0){r28=0;break}r20=_malloc(r24+67|0);if((r20|0)==0){r28=0;break}r26=67-(r20+67&63)|0;HEAP32[r20+(r26-4)>>2]=r20;r28=r20+r26|0}}while(0);HEAP32[((r23<<4)+17396>>2)+r3]=r28;r26=HEAP32[1312861];do{if((r26|0)==0){r4=407}else{r20=FUNCTION_TABLE[r26](r24,2);if((r20|0)==0){r4=407;break}else{r29=r20;break}}}while(0);do{if(r4==407){r4=0;if((r24|0)==0){r29=0;break}r26=_malloc(r24+67|0);if((r26|0)==0){r29=0;break}r20=67-(r26+67&63)|0;HEAP32[r26+(r20-4)>>2]=r26;r29=r26+r20|0}}while(0);HEAP32[((r23<<4)+17400>>2)+r3]=r29;r24=HEAP32[r16];if((r24|0)<3){r23=r24}else{break}}r30=HEAP32[r7]}else{r30=r13}r23=(r30|0)==3;r16=HEAP32[r3+4346];r18=(r1+17388|0)>>2;r17=r1+17392|0;do{if((r16|0)==(r17|0)){r4=419}else{if((HEAP32[r18]|0)==(r17|0)){r4=419;break}else{r31=r17;break}}}while(0);do{if(r4==419){r17=r1+17408|0;if((r16|0)!=(r17|0)){if((HEAP32[r18]|0)!=(r17|0)){r31=r17;break}}r17=r1+17424|0;if((r16|0)==(r17|0)){break L381}if((HEAP32[r18]|0)==(r17|0)){break L381}else{r31=r17}}}while(0);HEAP32[r21]=r31;HEAP32[r3+4228]=r31;do{if(r23){r4=417}else{if((HEAP32[r10]&8|0)==0){break L381}if((HEAP32[r19]|0)==0){break}else{r4=417;break}}}while(0);if(r4==417){HEAP32[r3+4232]=r31}HEAP32[r3+4231]=r31;break}r23=r1+17500|0;if((HEAP32[r23>>2]|0)==0){r18=HEAP32[r3+4373];r16=HEAP32[1312861];do{if((r16|0)==0){r4=313}else{r17=FUNCTION_TABLE[r16](r18,3);if((r17|0)==0){r4=313;break}else{r32=r17;break}}}while(0);do{if(r4==313){if((r18|0)==0){r32=0;break}r16=_malloc(r18+67|0);if((r16|0)==0){r32=0;break}r17=67-(r16+67&63)|0;HEAP32[r16+(r17-4)>>2]=r16;r32=r16+r17|0}}while(0);HEAP32[r3+100]=r32;FUNCTION_TABLE[HEAP32[r19]](2,r32,r9,HEAP32[r3+4374],r2,HEAP32[r3+4372],r6);HEAP32[r23>>2]=HEAP32[r6+16>>2];HEAP32[r3+99]=HEAP32[r6+20>>2];r18=r1+44|0;r17=Math.imul(HEAP32[r3+4271],HEAP32[r18>>2]);r16=r1+16832|0;r15=r17>>2-HEAP32[r16>>2];r24=HEAP32[1312861];do{if((r24|0)==0){r4=318}else{r20=FUNCTION_TABLE[r24](r17,2);if((r20|0)==0){r4=318;break}else{r33=r20;break}}}while(0);do{if(r4==318){if((r17|0)==0){r33=0;break}r24=_malloc(r17+67|0);if((r24|0)==0){r33=0;break}r23=67-(r24+67&63)|0;HEAP32[r24+(r23-4)>>2]=r24;r33=r24+r23|0}}while(0);HEAP32[r3+4361]=r33;r23=HEAP32[1312861];do{if((r23|0)==0){r4=323}else{r24=FUNCTION_TABLE[r23](r15,2);if((r24|0)==0){r4=323;break}else{r34=r24;break}}}while(0);do{if(r4==323){if((r15|0)==0){r34=0;break}r23=_malloc(r15+67|0);if((r23|0)==0){r34=0;break}r24=67-(r23+67&63)|0;HEAP32[r23+(r24-4)>>2]=r23;r34=r23+r24|0}}while(0);HEAP32[r3+4362]=r34;r24=HEAP32[1312861];do{if((r24|0)==0){r4=328}else{r23=FUNCTION_TABLE[r24](r15,2);if((r23|0)==0){r4=328;break}else{r35=r23;break}}}while(0);do{if(r4==328){if((r15|0)==0){r35=0;break}r24=_malloc(r15+67|0);if((r24|0)==0){r35=0;break}r23=67-(r24+67&63)|0;HEAP32[r24+(r23-4)>>2]=r24;r35=r24+r23|0}}while(0);HEAP32[r3+4363]=r35;r23=HEAP32[1312861];do{if((r23|0)==0){r4=333}else{r24=FUNCTION_TABLE[r23](r17,2);if((r24|0)==0){r4=333;break}else{r36=r24;break}}}while(0);do{if(r4==333){if((r17|0)==0){r36=0;break}r23=_malloc(r17+67|0);if((r23|0)==0){r36=0;break}r24=67-(r23+67&63)|0;HEAP32[r23+(r24-4)>>2]=r23;r36=r23+r24|0}}while(0);HEAP32[r3+4364]=r36;r17=HEAP32[1312861];do{if((r17|0)==0){r4=338}else{r24=FUNCTION_TABLE[r17](r15,2);if((r24|0)==0){r4=338;break}else{r37=r24;break}}}while(0);do{if(r4==338){if((r15|0)==0){r37=0;break}r17=_malloc(r15+67|0);if((r17|0)==0){r37=0;break}r24=67-(r17+67&63)|0;HEAP32[r17+(r24-4)>>2]=r17;r37=r17+r24|0}}while(0);HEAP32[r3+4365]=r37;r24=HEAP32[1312861];do{if((r24|0)==0){r4=343}else{r17=FUNCTION_TABLE[r24](r15,2);if((r17|0)==0){r4=343;break}else{r38=r17;break}}}while(0);do{if(r4==343){if((r15|0)==0){r38=0;break}r24=_malloc(r15+67|0);if((r24|0)==0){r38=0;break}r17=67-(r24+67&63)|0;HEAP32[r24+(r17-4)>>2]=r24;r38=r24+r17|0}}while(0);HEAP32[r3+4366]=r38;r15=HEAP32[r18>>2]<<5;r17=r15>>2-HEAP32[r16>>2];r24=HEAP32[1312861];do{if((r24|0)==0){r4=348}else{r23=FUNCTION_TABLE[r24](r15,2);if((r23|0)==0){r4=348;break}else{r39=r23;break}}}while(0);do{if(r4==348){if((r15|0)==0){r39=0;break}r24=_malloc(r15+67|0);if((r24|0)==0){r39=0;break}r16=67-(r24+67&63)|0;HEAP32[r24+(r16-4)>>2]=r24;r39=r24+r16|0}}while(0);HEAP32[r3+4367]=r39;r15=HEAP32[1312861];do{if((r15|0)==0){r4=353}else{r16=FUNCTION_TABLE[r15](r17,2);if((r16|0)==0){r4=353;break}else{r40=r16;break}}}while(0);do{if(r4==353){if((r17|0)==0){r40=0;break}r15=_malloc(r17+67|0);if((r15|0)==0){r40=0;break}r16=67-(r15+67&63)|0;HEAP32[r15+(r16-4)>>2]=r15;r40=r15+r16|0}}while(0);HEAP32[r3+4368]=r40;r16=HEAP32[1312861];do{if((r16|0)==0){r4=358}else{r15=FUNCTION_TABLE[r16](r17,2);if((r15|0)==0){r4=358;break}else{r41=r15;break}}}while(0);do{if(r4==358){if((r17|0)==0){r41=0;break}r16=_malloc(r17+67|0);if((r16|0)==0){r41=0;break}r15=67-(r16+67&63)|0;HEAP32[r16+(r15-4)>>2]=r16;r41=r16+r15|0}}while(0);HEAP32[r3+4369]=r41}if((HEAP32[r3+4360]|0)!=0){break}r17=(r1+17008|0)>>2;r15=HEAP32[r17];L521:do{if((r15|0)<3){r16=r6+4|0;r24=r6+8|0;r18=r6+12|0;r23=r15;while(1){HEAP32[r17]=r23+1|0;HEAP32[((r23<<4)+17404>>2)+r3]=0;r20=HEAP32[r16>>2];r26=HEAP32[1312861];do{if((r26|0)==0){r4=367}else{r25=FUNCTION_TABLE[r26](r20,4);if((r25|0)==0){r4=367;break}else{r42=r25;break}}}while(0);do{if(r4==367){r4=0;if((r20|0)==0){r42=0;break}r26=_malloc(r20+67|0);if((r26|0)==0){r42=0;break}r25=67-(r26+67&63)|0;HEAP32[r26+(r25-4)>>2]=r26;r42=r26+r25|0}}while(0);HEAP32[((r23<<4)+17392>>2)+r3]=r42;r20=HEAP32[r24>>2];r25=HEAP32[1312861];do{if((r25|0)==0){r4=372}else{r26=FUNCTION_TABLE[r25](r20,4);if((r26|0)==0){r4=372;break}else{r43=r26;break}}}while(0);do{if(r4==372){r4=0;if((r20|0)==0){r43=0;break}r25=_malloc(r20+67|0);if((r25|0)==0){r43=0;break}r26=67-(r25+67&63)|0;HEAP32[r25+(r26-4)>>2]=r25;r43=r25+r26|0}}while(0);HEAP32[((r23<<4)+17396>>2)+r3]=r43;r20=HEAP32[r18>>2];r26=HEAP32[1312861];do{if((r26|0)==0){r4=377}else{r25=FUNCTION_TABLE[r26](r20,4);if((r25|0)==0){r4=377;break}else{r44=r25;break}}}while(0);do{if(r4==377){r4=0;if((r20|0)==0){r44=0;break}r26=_malloc(r20+67|0);if((r26|0)==0){r44=0;break}r25=67-(r26+67&63)|0;HEAP32[r26+(r25-4)>>2]=r26;r44=r26+r25|0}}while(0);HEAP32[((r23<<4)+17400>>2)+r3]=r44;r20=HEAP32[r17];if((r20|0)<3){r23=r20}else{break L521}}}}while(0);r17=(HEAP32[r7]|0)==3;r15=HEAP32[r3+4346];r23=(r1+17388|0)>>2;r18=r1+17392|0;do{if((r15|0)==(r18|0)){r4=388}else{if((HEAP32[r23]|0)==(r18|0)){r4=388;break}else{r45=r18;break}}}while(0);do{if(r4==388){r18=r1+17408|0;if((r15|0)!=(r18|0)){if((HEAP32[r23]|0)!=(r18|0)){r45=r18;break}}r18=r1+17424|0;if((r15|0)==(r18|0)){break L381}if((HEAP32[r23]|0)==(r18|0)){break L381}else{r45=r18}}}while(0);HEAP32[r21]=r45;HEAP32[r3+4228]=r45;do{if(r17){r4=386}else{if((HEAP32[r10]&8|0)==0){break L381}if((HEAP32[r19]|0)==0){break}else{r4=386;break}}}while(0);if(r4==386){HEAP32[r3+4232]=r45}HEAP32[r3+4231]=r45}else{HEAP32[r14>>2]=1;r19=(r1+17376|0)>>2;r17=HEAP32[r19]+44|0;HEAP32[r19]=r17;_memcpy(r17,r12,44);r17=HEAP32[r19];HEAP32[r3+4227]=r17;if((r11|0)==0){if((HEAP32[r7]|0)!=3){break}}HEAP32[r3+4230]=r17}}while(0);r7=HEAP32[r3+4254];if((r7|0)==0){STACKTOP=r5;return}HEAP32[r3+4233]=HEAP32[r3+4240];HEAP32[r3+4234]=r7-3|0;STACKTOP=r5;return}function _mpeg2_header_extension(r1){var r2,r3,r4,r5,r6;r2=HEAPU8[HEAP32[r1+16964>>2]]>>>4;r3=1<<r2;r4=r1+16956|0;r5=HEAP32[r4>>2];if((r3&r5|0)==0){r6=0;return r6}HEAP32[r4>>2]=r5&(r3^-1);r6=FUNCTION_TABLE[HEAP32[(r2<<2)+5243436>>2]](r1);return r6}function _copyright_ext(r1){return 0}function _sequence_ext(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=r1>>2;r3=0;r4=HEAP32[r2+4241];r5=r4+3|0;if((HEAP8[r5]&1)<<24>>24==0){r6=1;return r6}r7=r4+1|0;HEAP8[r1+17076|0]=HEAPU8[r7]>>>4|HEAP8[r4]<<4;r8=r4+2|0;r9=r1+17048|0;r10=((HEAPU8[r8]<<5|HEAPU8[r7]<<13)&12288)+HEAP32[r9>>2]|0;HEAP32[r9>>2]=r10;HEAP32[r2+4264]=r10;r9=r1+17052|0;r11=(HEAPU8[r8]<<7&12288)+HEAP32[r9>>2]|0;HEAP32[r9>>2]=r11;HEAP32[r2+4265]=r11;r9=r10+15&-16;HEAP32[r2+4255]=r9;r10=r11+15&-16;r11=r1+17024|0;HEAP32[r11>>2]=r10;r12=r1+17044|0;r13=HEAP32[r12>>2]|1;if((HEAP8[r7]&8)<<24>>24==0){r14=r10+31&-32;HEAP32[r11>>2]=r14;r15=r13&-5;r16=r14}else{r15=r13;r16=r10}r10=r4+5|0;HEAP32[r12>>2]=HEAP8[r10]<<24>>24<0?r15|8:r15;r15=r1+17028|0;HEAP32[r15>>2]=r9;r12=r1+17032|0;HEAP32[r12>>2]=r16;r13=HEAP8[r7]&6;do{if((r13|0)==2){HEAP32[r12>>2]=r16>>>1;r3=442;break}else if((r13|0)==0){r6=1;return r6}else if((r13|0)==4){r3=442}}while(0);if(r3==442){HEAP32[r15>>2]=r9>>>1}r9=r1+17036|0;HEAP32[r9>>2]=((HEAPU8[r5]<<17|HEAPU8[r8]<<25)&1073479680)+HEAP32[r9>>2]|0;r9=r1+17040|0;HEAP32[r9>>2]=HEAPU8[r4+4|0]<<21|HEAP32[r9>>2];r9=r1+17072|0;r1=HEAPU8[r10];HEAP32[r9>>2]=Math.floor((Math.imul((r1&31)+1|0,HEAP32[r9>>2])>>>0)/(((r1>>>2&3)+1|0)>>>0));HEAP32[r2+4239]=4;r6=0;return r6}function _sequence_display_ext(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP32[r1+16964>>2];if((HEAP8[r2]&1)<<24>>24==0){r3=r2}else{HEAP8[r1+17077|0]=HEAP8[r2+1|0];HEAP8[r1+17078|0]=HEAP8[r2+2|0];r4=r2+3|0;HEAP8[r1+17079|0]=HEAP8[r4];r3=r4}r4=r3+2|0;r2=HEAP8[r4];r5=r2&255;if((r5&2|0)==0){r6=1;return r6}r7=HEAPU8[r3+1|0]<<6|r5>>>2;if((r7|0)==0){r8=r2}else{HEAP32[r1+17056>>2]=r7;r8=HEAP8[r4]}r4=(r8&255)<<13&8192|HEAPU8[r3+3|0]<<5|HEAPU8[r3+4|0]>>>3;if((r4|0)==0){r6=0;return r6}HEAP32[r1+17060>>2]=r4;r6=0;return r6}function _quant_matrix_ext(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=HEAP32[r1+16964>>2];r3=(r1+17516|0)>>2;r4=HEAP8[r2];if((r4&8)<<24>>24==0){r5=r2;r6=r4}else{r7=0;r8=r4;while(1){r4=r7+1|0;r9=r2+r4|0;HEAP8[HEAPU8[r7+5243072|0]+r1+17781|0]=HEAPU8[r9]>>>3|r8<<5;if((r4|0)==64){break}r7=r4;r8=HEAP8[r9]}HEAP32[r3]=HEAP32[r3]|1;r8=r2+64|0;r5=r8;r6=HEAP8[r8]}if((r6&4)<<24>>24==0){r10=r5;r11=r6}else{r8=0;r2=r6;while(1){r6=r8+1|0;r7=r5+r6|0;HEAP8[HEAPU8[r8+5243072|0]+r1+17845|0]=HEAPU8[r7]>>>2|r2<<6;if((r6|0)==64){break}r8=r6;r2=HEAP8[r7]}HEAP32[r3]=HEAP32[r3]|2;r2=r5+64|0;r10=r2;r11=HEAP8[r2]}if((r11&2)<<24>>24==0){r12=r10;r13=r11}else{r2=0;r5=r11;while(1){r11=r2+1|0;r8=r10+r11|0;HEAP8[HEAPU8[r2+5243072|0]+r1+17909|0]=HEAPU8[r8]>>>1|r5<<7;if((r11|0)==64){break}r2=r11;r5=HEAP8[r8]}HEAP32[r3]=HEAP32[r3]|4;r5=r10+64|0;r12=r5;r13=HEAP8[r5]}if((r13&1)<<24>>24==0){return 0}else{r14=0}while(1){r13=r14+1|0;HEAP8[HEAPU8[r14+5243072|0]+r1+17973|0]=HEAP8[r12+r13|0];if((r13|0)==64){break}else{r14=r13}}HEAP32[r3]=HEAP32[r3]|8;return 0}function _picture_display_ext(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=r1>>2;r3=0;r4=HEAP32[r2+4241];r5=HEAP32[r2+4290]>>(HEAP32[r2+4276]>>>2&1);do{if((r5|0)>0){r6=r1+17512|0;r7=r1+17514|0;r8=0;while(1){r9=r8<<2;r10=HEAPU8[r4+(r9|2)|0];r11=HEAPU8[r4+(r9|3)|0];r12=r8<<1;r13=(HEAPU8[r4+(r9|1)|0]<<16|HEAPU8[r4+r9|0]<<24|r10<<8|r11)>>11-r12;r14=(r11<<16|r10<<24|HEAPU8[r9+(r4+4)|0]<<8|HEAPU8[r9+(r4+5)|0])>>10-r12;if((r13&1&r14|0)==0){r15=1;r3=486;break}r12=r13>>>1;HEAP16[r6>>1]=r12&65535;HEAP32[((r8<<3)+17176>>2)+r2]=r12<<16>>16;r12=r14>>>1;HEAP16[r7>>1]=r12&65535;HEAP32[((r8<<3)+17180>>2)+r2]=r12<<16>>16;r16=r8+1|0;if((r16|0)<(r5|0)){r8=r16}else{break}}if(r3==486){return r15}if((r16|0)<3){r17=r16;break}else{r15=0}return r15}else{r17=0}}while(0);r16=r1+17512|0;r3=r1+17514|0;r1=r17;while(1){HEAP32[((r1<<3)+17176>>2)+r2]=HEAP16[r16>>1]<<16>>16;HEAP32[((r1<<3)+17180>>2)+r2]=HEAP16[r3>>1]<<16>>16;r17=r1+1|0;if((r17|0)==3){r15=0;break}else{r1=r17}}return r15}function _picture_coding_ext(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=r1>>2;r3=0;r4=HEAP32[r2+4241];HEAP32[r2+42]=(HEAP8[r4]&15)-1|0;r5=r4+1|0;HEAP32[r2+43]=(HEAPU8[r5]>>>4)-1|0;HEAP32[r2+28]=(HEAP8[r5]&15)-1|0;r5=r4+2|0;HEAP32[r2+29]=(HEAPU8[r5]>>>4)-1|0;r6=r1+17172|0;r7=HEAP32[r6>>2];HEAP32[r2+4210]=HEAPU8[r5]>>>2&3^7;r8=HEAP8[r5]&3;HEAP32[r2+4211]=r8;do{if((r8|0)==3){r5=r4+3|0;r9=HEAPU8[r5];r10=r9&2;if((HEAP32[r2+4276]&4|0)==0){HEAP32[r2+4290]=r10>>>1|2;r11=(HEAP8[r5]<<24>>24<0?8:0)|r7;r12=r5;break}if((r10|0)==0){r13=2}else{r13=r9>>>6&2|4}HEAP32[r2+4290]=r13;r11=r7;r12=r5;break}else if((r8|0)==2){r14=r7;r3=490}else if((r8|0)==1){r14=r7|8;r3=490;break}else{r15=1;return r15}}while(0);if(r3==490){HEAP32[r2+4290]=1;r11=r14;r12=r4+3|0}HEAP32[r2+4215]=HEAPU8[r12]>>>7;HEAP32[r2+4212]=HEAPU8[r12]>>>6&1;HEAP32[r2+4213]=HEAPU8[r12]>>>5&1;HEAP8[r1+17520|0]=HEAP8[r12]&16;HEAP32[r2+4214]=HEAPU8[r12]>>>3&1;HEAP32[r2+4216]=(HEAP8[r12]&4)<<24>>24!=0?5243136:5243072;r12=HEAPU8[r4+4|0];r1=r12>>>3&16|r11;if((r12&64|0)==0){r16=r1}else{r16=r12<<26|r1|HEAPU8[r4+5|0]<<18|HEAPU8[r4+6|0]<<10&258048|32}HEAP32[r6>>2]=r16;HEAP32[r2+4239]=152;r15=0;return r15}function _mpeg2_header_user_data(r1){var r2,r3,r4;r2=HEAP32[r1+16968>>2]-1|0;r3=r1+16964|0;r4=r1+17016|0;HEAP32[r4>>2]=r2-HEAP32[r3>>2]+HEAP32[r4>>2]|0;HEAP32[r3>>2]=r2;return 0}function _mpeg2_header_slice_start(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r1|0;HEAP32[r1+16932>>2]=0;HEAP32[r1+16936>>2]=0;r3=(r1+17376|0)>>2;r4=(r1+16952|0)>>2;if(HEAP32[HEAP32[r3]+4>>2]>>>0>1){r5=7}else{r5=(HEAP32[r4]|0)==6?7:5}HEAP32[r4]=r5;r5=(r1+16836|0)>>2;L667:do{if((HEAP32[r5]|0)!=4){r6=r1+17521|0;r7=r1+17520|0;r8=HEAP8[r7];L669:do{if(HEAP8[r6]<<24>>24!=r8<<24>>24){HEAP8[r6]=r8;r9=0;r10=r8;while(1){if(r10<<24>>24==0){r11=r9<<1}else{r11=HEAP32[(r9<<2)+5242944>>2]}r12=0;while(1){HEAP16[r1+(r9<<7)+(r12<<1)+436>>1]=Math.imul(HEAPU8[r1+(r12+17525)|0],r11)&65535;r13=r12+1|0;if((r13|0)==64){break}else{r12=r13}}r12=r9+1|0;if((r12|0)==32){break L669}r9=r12;r10=HEAP8[r7]}}}while(0);L682:do{if((HEAP32[r1+428>>2]|0)==(r1+8628|0)){r8=r1+17523|0;r6=HEAP8[r7];if(HEAP8[r8]<<24>>24==r6<<24>>24){break}HEAP8[r8]=r6;r8=0;r10=r6;while(1){if(r10<<24>>24==0){r14=r8<<1}else{r14=HEAP32[(r8<<2)+5242944>>2]}r6=0;while(1){HEAP16[r1+(r8<<7)+(r6<<1)+8628>>1]=Math.imul(HEAPU8[r1+(r6+17653)|0],r14)&65535;r9=r6+1|0;if((r9|0)==64){break}else{r6=r9}}r6=r8+1|0;if((r6|0)==32){break L682}r8=r6;r10=HEAP8[r7]}}}while(0);if((HEAP32[r5]|0)==1){break}r10=r1+17522|0;r8=HEAP8[r7];L697:do{if(HEAP8[r10]<<24>>24!=r8<<24>>24){HEAP8[r10]=r8;r6=0;r9=r8;while(1){if(r9<<24>>24==0){r15=r6<<1}else{r15=HEAP32[(r6<<2)+5242944>>2]}r12=0;while(1){HEAP16[r1+(r6<<7)+(r12<<1)+4532>>1]=Math.imul(HEAPU8[r1+(r12+17589)|0],r15)&65535;r13=r12+1|0;if((r13|0)==64){break}else{r12=r13}}r12=r6+1|0;if((r12|0)==32){break L697}r6=r12;r9=HEAP8[r7]}}}while(0);if((HEAP32[r1+432>>2]|0)!=(r1+12724|0)){break}r8=r1+17524|0;r10=HEAP8[r7];if(HEAP8[r8]<<24>>24==r10<<24>>24){break}HEAP8[r8]=r10;r8=0;r9=r10;while(1){if(r9<<24>>24==0){r16=r8<<1}else{r16=HEAP32[(r8<<2)+5242944>>2]}r10=0;while(1){HEAP16[r1+(r8<<7)+(r10<<1)+12724>>1]=Math.imul(HEAPU8[r1+(r10+17717)|0],r16)&65535;r6=r10+1|0;if((r6|0)==64){break}else{r10=r6}}r10=r8+1|0;if((r10|0)==32){break L667}r8=r10;r9=HEAP8[r7]}}}while(0);if(HEAP8[r1+17013|0]<<24>>24==0){r16=HEAP32[r3]+16|0;HEAP32[r16>>2]=HEAP32[r16>>2]|64;r17=r1+16948|0,r18=r17>>2;HEAP32[r18]=0;return-1}r16=HEAP32[r1+17500>>2];if((r16|0)==0){r15=(HEAP32[r5]|0)==3;_mpeg2_init_fbuf(r2,HEAP32[r1+17380>>2]|0,HEAP32[r1+((r15?2:1)<<2)+17380>>2]|0,HEAP32[r1+((r15&1)<<2)+17380>>2]|0);r17=r1+16948|0,r18=r17>>2;HEAP32[r18]=0;return-1}FUNCTION_TABLE[r16](HEAP32[r1+400>>2],HEAP32[r1+17380>>2],HEAP32[r3],HEAP32[r1+16900>>2]);if((HEAP32[r5]|0)==3){r5=HEAP32[r1+17480>>2];_mpeg2_init_fbuf(r2,r1+17468|0,r1+((r5^1)*12&-1)+17444|0,r1+(r5*12&-1)+17444|0);r17=r1+16948|0,r18=r17>>2;HEAP32[r18]=0;return-1}r5=(r1+17480|0)>>2;r3=HEAP32[r5];r16=r1+(r3*12&-1)+17444|0;_mpeg2_init_fbuf(r2,r1+((r3^1)*12&-1)+17444|0,r16,r16);if((HEAP32[r4]|0)!=7){r17=r1+16948|0,r18=r17>>2;HEAP32[r18]=0;return-1}HEAP32[r5]=HEAP32[r5]^1;r17=r1+16948|0,r18=r17>>2;HEAP32[r18]=0;return-1}function _MC_put_o_16_c(r1,r2,r3,r4){var r5;r5=r4;r4=r1;r1=r2;while(1){HEAP8[r4]=HEAP8[r1];HEAP8[r4+1|0]=HEAP8[r1+1|0];HEAP8[r4+2|0]=HEAP8[r1+2|0];HEAP8[r4+3|0]=HEAP8[r1+3|0];HEAP8[r4+4|0]=HEAP8[r1+4|0];HEAP8[r4+5|0]=HEAP8[r1+5|0];HEAP8[r4+6|0]=HEAP8[r1+6|0];HEAP8[r4+7|0]=HEAP8[r1+7|0];HEAP8[r4+8|0]=HEAP8[r1+8|0];HEAP8[r4+9|0]=HEAP8[r1+9|0];HEAP8[r4+10|0]=HEAP8[r1+10|0];HEAP8[r4+11|0]=HEAP8[r1+11|0];HEAP8[r4+12|0]=HEAP8[r1+12|0];HEAP8[r4+13|0]=HEAP8[r1+13|0];HEAP8[r4+14|0]=HEAP8[r1+14|0];HEAP8[r4+15|0]=HEAP8[r1+15|0];r2=r5-1|0;if((r2|0)==0){break}else{r5=r2;r4=r4+r3|0;r1=r1+r3|0}}return}function _seek_sequence(r1){_memset(r1+16896|0,0,36);_mpeg2_header_state_init(r1);HEAP32[r1+16948>>2]=100;return _mpeg2_seek_header(r1)}function _mpeg2_idct_copy_c(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r4=0;while(1){r5=r4<<3;r6=(r5<<1)+r1|0;r7=((r5|1)<<1)+r1|0;r8=HEAP16[r7>>1]<<16>>16;r9=((r5|2)<<1)+r1|0;r10=r9;r11=HEAP32[r10>>2];r12=((r5|4)<<1)+r1|0;r13=r12;r14=HEAP32[r13>>2];r15=((r5|6)<<1)+r1|0;r16=r15;r17=HEAP32[r16>>2];r18=HEAP16[r6>>1]<<16>>16;if((r8|r11|r14|r17|0)==0){r19=r18>>>1;r20=r19&65535|r19<<16;HEAP32[r6>>2]=r20;HEAP32[r10>>2]=r20;HEAP32[r13>>2]=r20;HEAP32[r16>>2]=r20}else{r20=(r18<<11)+2048|0;r18=r11<<16>>5;r11=((r5|3)<<1)+r1|0;r16=HEAP16[r11>>1]<<16>>16;r13=r18+r20|0;r10=r20-r18|0;r18=(r16+r8)*1108&-1;r20=r18+(r8*1568&-1)|0;r8=r18+(r16*-3784&-1)|0;r16=r20+r13|0;r18=r8+r10|0;r19=r10-r8|0;r8=r13-r20|0;r20=r14<<16>>16;r14=((r5|5)<<1)+r1|0;r13=HEAP16[r14>>1]<<16>>16;r10=r17<<16>>16;r17=((r5|7)<<1)+r1|0;r5=HEAP16[r17>>1]<<16>>16;r21=(r5+r20)*565&-1;r22=r21+(r20*2276&-1)|0;r20=r21+(r5*-3406&-1)|0;r5=(r10+r13)*2408&-1;r21=r5+(r10*-799&-1)|0;r10=r5+(r13*-4017&-1)|0;r13=r22+r21|0;r5=r20+r10|0;r23=r22-r21|0;r21=r20-r10|0;r10=(r23+r21>>8)*181&-1;r20=(r23-r21>>8)*181&-1;HEAP16[r6>>1]=(r13+r16|0)>>>12&65535;HEAP16[r7>>1]=(r10+r18|0)>>>12&65535;HEAP16[r9>>1]=(r20+r19|0)>>>12&65535;HEAP16[r11>>1]=(r5+r8|0)>>>12&65535;HEAP16[r12>>1]=(r8-r5|0)>>>12&65535;HEAP16[r14>>1]=(r19-r20|0)>>>12&65535;HEAP16[r15>>1]=(r18-r10|0)>>>12&65535;HEAP16[r17>>1]=(r16-r13|0)>>>12&65535}r13=r4+1|0;if((r13|0)==8){r24=0;break}else{r4=r13}}while(1){r4=(r24<<1)+r1|0;r13=(HEAP16[r4>>1]<<16>>16<<11)+65536|0;r16=(r24+8<<1)+r1|0;r17=HEAP16[r16>>1]<<16>>16;r10=(r24+16<<1)+r1|0;r18=HEAP16[r10>>1]<<16>>16<<11;r15=(r24+24<<1)+r1|0;r20=HEAP16[r15>>1]<<16>>16;r19=r18+r13|0;r14=r13-r18|0;r18=(r20+r17)*1108&-1;r13=r18+(r17*1568&-1)|0;r17=r18+(r20*-3784&-1)|0;r20=r13+r19|0;r18=r17+r14|0;r5=r14-r17|0;r17=r19-r13|0;r13=(r24+32<<1)+r1|0;r19=HEAP16[r13>>1]<<16>>16;r14=(r24+40<<1)+r1|0;r8=HEAP16[r14>>1]<<16>>16;r12=(r24+48<<1)+r1|0;r11=HEAP16[r12>>1]<<16>>16;r9=(r24+56<<1)+r1|0;r7=HEAP16[r9>>1]<<16>>16;r6=(r7+r19)*565&-1;r21=r6+(r19*2276&-1)|0;r19=r6+(r7*-3406&-1)|0;r7=(r11+r8)*2408&-1;r6=r7+(r11*-799&-1)|0;r11=r7+(r8*-4017&-1)|0;r8=r21+r6|0;r7=r19+r11|0;r23=r21-r6|0;r6=r19-r11|0;r11=(r23+r6>>8)*181&-1;r19=(r23-r6>>8)*181&-1;HEAP16[r4>>1]=r8+r20>>17&65535;HEAP16[r16>>1]=r11+r18>>17&65535;HEAP16[r10>>1]=r19+r5>>17&65535;HEAP16[r15>>1]=r7+r17>>17&65535;HEAP16[r13>>1]=r17-r7>>17&65535;HEAP16[r14>>1]=r5-r19>>17&65535;HEAP16[r12>>1]=r18-r11>>17&65535;HEAP16[r9>>1]=r20-r8>>17&65535;r8=r24+1|0;if((r8|0)==8){r25=8;r26=r1,r27=r26>>1;r28=r2;break}else{r24=r8}}while(1){HEAP8[r28]=HEAP8[(HEAP16[r27]<<16>>16)+5247320|0];HEAP8[r28+1|0]=HEAP8[(HEAP16[r27+1]<<16>>16)+5247320|0];HEAP8[r28+2|0]=HEAP8[(HEAP16[r27+2]<<16>>16)+5247320|0];HEAP8[r28+3|0]=HEAP8[(HEAP16[r27+3]<<16>>16)+5247320|0];HEAP8[r28+4|0]=HEAP8[(HEAP16[r27+4]<<16>>16)+5247320|0];HEAP8[r28+5|0]=HEAP8[(HEAP16[r27+5]<<16>>16)+5247320|0];HEAP8[r28+6|0]=HEAP8[(HEAP16[r27+6]<<16>>16)+5247320|0];HEAP8[r28+7|0]=HEAP8[(HEAP16[r27+7]<<16>>16)+5247320|0];r24=r25-1|0;r2=r26>>2;HEAP32[r2]=0;HEAP32[r2+1]=0;HEAP32[r2+2]=0;HEAP32[r2+3]=0;if((r24|0)==0){break}else{r25=r24;r26=r26+16|0,r27=r26>>1;r28=r28+r3|0}}return}function _mpeg2_idct_add_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;do{if((r1|0)==129){r5=HEAP16[r2>>1]<<16>>16;if((r5&112|0)==64){r6=0;break}HEAP16[r2+126>>1]=0;HEAP16[r2>>1]=0;r7=(r5+64>>7)+3840|0;r5=8;r8=r3;while(1){HEAP8[r8]=HEAP8[r7+HEAPU8[r8]+5243480|0];r9=r8+1|0;HEAP8[r9]=HEAP8[r7+HEAPU8[r9]+5243480|0];r9=r8+2|0;HEAP8[r9]=HEAP8[r7+HEAPU8[r9]+5243480|0];r9=r8+3|0;HEAP8[r9]=HEAP8[r7+HEAPU8[r9]+5243480|0];r9=r8+4|0;HEAP8[r9]=HEAP8[r7+HEAPU8[r9]+5243480|0];r9=r8+5|0;HEAP8[r9]=HEAP8[r7+HEAPU8[r9]+5243480|0];r9=r8+6|0;HEAP8[r9]=HEAP8[r7+HEAPU8[r9]+5243480|0];r9=r8+7|0;HEAP8[r9]=HEAP8[r7+HEAPU8[r9]+5243480|0];r9=r5-1|0;if((r9|0)==0){break}else{r5=r9;r8=r8+r4|0}}return}else{r6=0}}while(0);while(1){r1=r6<<3;r8=(r1<<1)+r2|0;r5=((r1|1)<<1)+r2|0;r7=HEAP16[r5>>1]<<16>>16;r9=((r1|2)<<1)+r2|0;r10=r9;r11=HEAP32[r10>>2];r12=((r1|4)<<1)+r2|0;r13=r12;r14=HEAP32[r13>>2];r15=((r1|6)<<1)+r2|0;r16=r15;r17=HEAP32[r16>>2];r18=HEAP16[r8>>1]<<16>>16;if((r7|r11|r14|r17|0)==0){r19=r18>>>1;r20=r19&65535|r19<<16;HEAP32[r8>>2]=r20;HEAP32[r10>>2]=r20;HEAP32[r13>>2]=r20;HEAP32[r16>>2]=r20}else{r20=(r18<<11)+2048|0;r18=r11<<16>>5;r11=((r1|3)<<1)+r2|0;r16=HEAP16[r11>>1]<<16>>16;r13=r18+r20|0;r10=r20-r18|0;r18=(r16+r7)*1108&-1;r20=r18+(r7*1568&-1)|0;r7=r18+(r16*-3784&-1)|0;r16=r20+r13|0;r18=r7+r10|0;r19=r10-r7|0;r7=r13-r20|0;r20=r14<<16>>16;r14=((r1|5)<<1)+r2|0;r13=HEAP16[r14>>1]<<16>>16;r10=r17<<16>>16;r17=((r1|7)<<1)+r2|0;r1=HEAP16[r17>>1]<<16>>16;r21=(r1+r20)*565&-1;r22=r21+(r20*2276&-1)|0;r20=r21+(r1*-3406&-1)|0;r1=(r10+r13)*2408&-1;r21=r1+(r10*-799&-1)|0;r10=r1+(r13*-4017&-1)|0;r13=r22+r21|0;r1=r20+r10|0;r23=r22-r21|0;r21=r20-r10|0;r10=(r23+r21>>8)*181&-1;r20=(r23-r21>>8)*181&-1;HEAP16[r8>>1]=(r13+r16|0)>>>12&65535;HEAP16[r5>>1]=(r10+r18|0)>>>12&65535;HEAP16[r9>>1]=(r20+r19|0)>>>12&65535;HEAP16[r11>>1]=(r1+r7|0)>>>12&65535;HEAP16[r12>>1]=(r7-r1|0)>>>12&65535;HEAP16[r14>>1]=(r19-r20|0)>>>12&65535;HEAP16[r15>>1]=(r18-r10|0)>>>12&65535;HEAP16[r17>>1]=(r16-r13|0)>>>12&65535}r13=r6+1|0;if((r13|0)==8){r24=0;break}else{r6=r13}}while(1){r6=(r24<<1)+r2|0;r13=(HEAP16[r6>>1]<<16>>16<<11)+65536|0;r16=(r24+8<<1)+r2|0;r17=HEAP16[r16>>1]<<16>>16;r10=(r24+16<<1)+r2|0;r18=HEAP16[r10>>1]<<16>>16<<11;r15=(r24+24<<1)+r2|0;r20=HEAP16[r15>>1]<<16>>16;r19=r18+r13|0;r14=r13-r18|0;r18=(r20+r17)*1108&-1;r13=r18+(r17*1568&-1)|0;r17=r18+(r20*-3784&-1)|0;r20=r13+r19|0;r18=r17+r14|0;r1=r14-r17|0;r17=r19-r13|0;r13=(r24+32<<1)+r2|0;r19=HEAP16[r13>>1]<<16>>16;r14=(r24+40<<1)+r2|0;r7=HEAP16[r14>>1]<<16>>16;r12=(r24+48<<1)+r2|0;r11=HEAP16[r12>>1]<<16>>16;r9=(r24+56<<1)+r2|0;r5=HEAP16[r9>>1]<<16>>16;r8=(r5+r19)*565&-1;r21=r8+(r19*2276&-1)|0;r19=r8+(r5*-3406&-1)|0;r5=(r11+r7)*2408&-1;r8=r5+(r11*-799&-1)|0;r11=r5+(r7*-4017&-1)|0;r7=r21+r8|0;r5=r19+r11|0;r23=r21-r8|0;r8=r19-r11|0;r11=(r23+r8>>8)*181&-1;r19=(r23-r8>>8)*181&-1;HEAP16[r6>>1]=r7+r20>>17&65535;HEAP16[r16>>1]=r11+r18>>17&65535;HEAP16[r10>>1]=r19+r1>>17&65535;HEAP16[r15>>1]=r5+r17>>17&65535;HEAP16[r13>>1]=r17-r5>>17&65535;HEAP16[r14>>1]=r1-r19>>17&65535;HEAP16[r12>>1]=r18-r11>>17&65535;HEAP16[r9>>1]=r20-r7>>17&65535;r7=r24+1|0;if((r7|0)==8){r25=r2,r26=r25>>1;r27=8;r28=r3;break}else{r24=r7}}while(1){HEAP8[r28]=HEAP8[(HEAP16[r26]<<16>>16)+HEAPU8[r28]+5247320|0];r24=r28+1|0;HEAP8[r24]=HEAP8[(HEAP16[r26+1]<<16>>16)+HEAPU8[r24]+5247320|0];r24=r28+2|0;HEAP8[r24]=HEAP8[(HEAP16[r26+2]<<16>>16)+HEAPU8[r24]+5247320|0];r24=r28+3|0;HEAP8[r24]=HEAP8[(HEAP16[r26+3]<<16>>16)+HEAPU8[r24]+5247320|0];r24=r28+4|0;HEAP8[r24]=HEAP8[(HEAP16[r26+4]<<16>>16)+HEAPU8[r24]+5247320|0];r24=r28+5|0;HEAP8[r24]=HEAP8[(HEAP16[r26+5]<<16>>16)+HEAPU8[r24]+5247320|0];r24=r28+6|0;HEAP8[r24]=HEAP8[(HEAP16[r26+6]<<16>>16)+HEAPU8[r24]+5247320|0];r24=r28+7|0;HEAP8[r24]=HEAP8[(HEAP16[r26+7]<<16>>16)+HEAPU8[r24]+5247320|0];r24=r27-1|0;r3=r25>>2;HEAP32[r3]=0;HEAP32[r3+1]=0;HEAP32[r3+2]=0;HEAP32[r3+3]=0;if((r24|0)==0){break}else{r25=r25+16|0,r26=r25>>1;r27=r24;r28=r28+r4|0}}return}function _MC_put_x_16_c(r1,r2,r3,r4){var r5,r6;r5=r4;r4=r1;r1=r2;while(1){r2=r1+1|0;HEAP8[r4]=(HEAPU8[r1]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+2|0;HEAP8[r4+1|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+3|0;HEAP8[r4+2|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+4|0;HEAP8[r4+3|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+5|0;HEAP8[r4+4|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+6|0;HEAP8[r4+5|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+7|0;HEAP8[r4+6|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+8|0;HEAP8[r4+7|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+9|0;HEAP8[r4+8|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+10|0;HEAP8[r4+9|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+11|0;HEAP8[r4+10|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+12|0;HEAP8[r4+11|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+13|0;HEAP8[r4+12|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+14|0;HEAP8[r4+13|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+15|0;HEAP8[r4+14|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;HEAP8[r4+15|0]=(HEAPU8[r2]+HEAPU8[r1+16|0]+1|0)>>>1&255;r2=r5-1|0;if((r2|0)==0){break}else{r5=r2;r4=r4+r3|0;r1=r1+r3|0}}return}function _MC_put_y_16_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r5=r3+1|0;r6=r3+2|0;r7=r3+3|0;r8=r3+4|0;r9=r3+5|0;r10=r3+6|0;r11=r3+7|0;r12=r3+8|0;r13=r3+9|0;r14=r3+10|0;r15=r3+11|0;r16=r3+12|0;r17=r3+13|0;r18=r3+14|0;r19=r3+15|0;r20=r4;r4=r1;r1=r2;while(1){r2=r1+r3|0;HEAP8[r4]=(HEAPU8[r1]+HEAPU8[r2]+1|0)>>>1&255;HEAP8[r4+1|0]=(HEAPU8[r1+1|0]+HEAPU8[r1+r5|0]+1|0)>>>1&255;HEAP8[r4+2|0]=(HEAPU8[r1+2|0]+HEAPU8[r1+r6|0]+1|0)>>>1&255;HEAP8[r4+3|0]=(HEAPU8[r1+3|0]+HEAPU8[r1+r7|0]+1|0)>>>1&255;HEAP8[r4+4|0]=(HEAPU8[r1+4|0]+HEAPU8[r1+r8|0]+1|0)>>>1&255;HEAP8[r4+5|0]=(HEAPU8[r1+5|0]+HEAPU8[r1+r9|0]+1|0)>>>1&255;HEAP8[r4+6|0]=(HEAPU8[r1+6|0]+HEAPU8[r1+r10|0]+1|0)>>>1&255;HEAP8[r4+7|0]=(HEAPU8[r1+7|0]+HEAPU8[r1+r11|0]+1|0)>>>1&255;HEAP8[r4+8|0]=(HEAPU8[r1+8|0]+HEAPU8[r1+r12|0]+1|0)>>>1&255;HEAP8[r4+9|0]=(HEAPU8[r1+9|0]+HEAPU8[r1+r13|0]+1|0)>>>1&255;HEAP8[r4+10|0]=(HEAPU8[r1+10|0]+HEAPU8[r1+r14|0]+1|0)>>>1&255;HEAP8[r4+11|0]=(HEAPU8[r1+11|0]+HEAPU8[r1+r15|0]+1|0)>>>1&255;HEAP8[r4+12|0]=(HEAPU8[r1+12|0]+HEAPU8[r1+r16|0]+1|0)>>>1&255;HEAP8[r4+13|0]=(HEAPU8[r1+13|0]+HEAPU8[r1+r17|0]+1|0)>>>1&255;HEAP8[r4+14|0]=(HEAPU8[r1+14|0]+HEAPU8[r1+r18|0]+1|0)>>>1&255;HEAP8[r4+15|0]=(HEAPU8[r1+15|0]+HEAPU8[r1+r19|0]+1|0)>>>1&255;r21=r20-1|0;if((r21|0)==0){break}else{r20=r21;r4=r4+r3|0;r1=r2}}return}function _MC_put_xy_16_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r5=r3+1|0;r6=r3+2|0;r7=r3+3|0;r8=r3+4|0;r9=r3+5|0;r10=r3+6|0;r11=r3+7|0;r12=r3+8|0;r13=r3+9|0;r14=r3+10|0;r15=r3+11|0;r16=r3+12|0;r17=r3+13|0;r18=r3+14|0;r19=r3+15|0;r20=r3+16|0;r21=r4;r4=r1;r1=r2;while(1){r2=r1+1|0;r22=r1+r3|0;r23=r1+r5|0;HEAP8[r4]=(HEAPU8[r1]+HEAPU8[r2]+HEAPU8[r22]+HEAPU8[r23]+2|0)>>>2&255;r24=r1+2|0;r25=r1+r6|0;HEAP8[r4+1|0]=(HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+2|0)>>>2&255;r23=r1+3|0;r2=r1+r7|0;HEAP8[r4+2|0]=(HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+2|0)>>>2&255;r25=r1+4|0;r24=r1+r8|0;HEAP8[r4+3|0]=(HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+2|0)>>>2&255;r2=r1+5|0;r23=r1+r9|0;HEAP8[r4+4|0]=(HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+2|0)>>>2&255;r24=r1+6|0;r25=r1+r10|0;HEAP8[r4+5|0]=(HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+2|0)>>>2&255;r23=r1+7|0;r2=r1+r11|0;HEAP8[r4+6|0]=(HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+2|0)>>>2&255;r25=r1+8|0;r24=r1+r12|0;HEAP8[r4+7|0]=(HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+2|0)>>>2&255;r2=r1+9|0;r23=r1+r13|0;HEAP8[r4+8|0]=(HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+2|0)>>>2&255;r24=r1+10|0;r25=r1+r14|0;HEAP8[r4+9|0]=(HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+2|0)>>>2&255;r23=r1+11|0;r2=r1+r15|0;HEAP8[r4+10|0]=(HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+2|0)>>>2&255;r25=r1+12|0;r24=r1+r16|0;HEAP8[r4+11|0]=(HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+2|0)>>>2&255;r2=r1+13|0;r23=r1+r17|0;HEAP8[r4+12|0]=(HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+2|0)>>>2&255;r24=r1+14|0;r25=r1+r18|0;HEAP8[r4+13|0]=(HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+2|0)>>>2&255;r23=r1+15|0;r2=r1+r19|0;HEAP8[r4+14|0]=(HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+2|0)>>>2&255;HEAP8[r4+15|0]=(HEAPU8[r23]+HEAPU8[r1+16|0]+HEAPU8[r2]+HEAPU8[r1+r20|0]+2|0)>>>2&255;r2=r21-1|0;if((r2|0)==0){break}else{r21=r2;r4=r4+r3|0;r1=r22}}return}function _MC_put_o_8_c(r1,r2,r3,r4){var r5;r5=r4;r4=r1;r1=r2;while(1){HEAP8[r4]=HEAP8[r1];HEAP8[r4+1|0]=HEAP8[r1+1|0];HEAP8[r4+2|0]=HEAP8[r1+2|0];HEAP8[r4+3|0]=HEAP8[r1+3|0];HEAP8[r4+4|0]=HEAP8[r1+4|0];HEAP8[r4+5|0]=HEAP8[r1+5|0];HEAP8[r4+6|0]=HEAP8[r1+6|0];HEAP8[r4+7|0]=HEAP8[r1+7|0];r2=r5-1|0;if((r2|0)==0){break}else{r5=r2;r4=r4+r3|0;r1=r1+r3|0}}return}function _MC_put_x_8_c(r1,r2,r3,r4){var r5,r6;r5=r4;r4=r1;r1=r2;while(1){r2=r1+1|0;HEAP8[r4]=(HEAPU8[r1]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+2|0;HEAP8[r4+1|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+3|0;HEAP8[r4+2|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+4|0;HEAP8[r4+3|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+5|0;HEAP8[r4+4|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;r6=r1+6|0;HEAP8[r4+5|0]=(HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1&255;r2=r1+7|0;HEAP8[r4+6|0]=(HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1&255;HEAP8[r4+7|0]=(HEAPU8[r2]+HEAPU8[r1+8|0]+1|0)>>>1&255;r2=r5-1|0;if((r2|0)==0){break}else{r5=r2;r4=r4+r3|0;r1=r1+r3|0}}return}function _MC_put_y_8_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;r5=r3+1|0;r6=r3+2|0;r7=r3+3|0;r8=r3+4|0;r9=r3+5|0;r10=r3+6|0;r11=r3+7|0;r12=r4;r4=r1;r1=r2;while(1){r2=r1+r3|0;HEAP8[r4]=(HEAPU8[r1]+HEAPU8[r2]+1|0)>>>1&255;HEAP8[r4+1|0]=(HEAPU8[r1+1|0]+HEAPU8[r1+r5|0]+1|0)>>>1&255;HEAP8[r4+2|0]=(HEAPU8[r1+2|0]+HEAPU8[r1+r6|0]+1|0)>>>1&255;HEAP8[r4+3|0]=(HEAPU8[r1+3|0]+HEAPU8[r1+r7|0]+1|0)>>>1&255;HEAP8[r4+4|0]=(HEAPU8[r1+4|0]+HEAPU8[r1+r8|0]+1|0)>>>1&255;HEAP8[r4+5|0]=(HEAPU8[r1+5|0]+HEAPU8[r1+r9|0]+1|0)>>>1&255;HEAP8[r4+6|0]=(HEAPU8[r1+6|0]+HEAPU8[r1+r10|0]+1|0)>>>1&255;HEAP8[r4+7|0]=(HEAPU8[r1+7|0]+HEAPU8[r1+r11|0]+1|0)>>>1&255;r13=r12-1|0;if((r13|0)==0){break}else{r12=r13;r4=r4+r3|0;r1=r2}}return}function _MC_put_xy_8_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r5=r3+1|0;r6=r3+2|0;r7=r3+3|0;r8=r3+4|0;r9=r3+5|0;r10=r3+6|0;r11=r3+7|0;r12=r3+8|0;r13=r4;r4=r1;r1=r2;while(1){r2=r1+1|0;r14=r1+r3|0;r15=r1+r5|0;HEAP8[r4]=(HEAPU8[r1]+HEAPU8[r2]+HEAPU8[r14]+HEAPU8[r15]+2|0)>>>2&255;r16=r1+2|0;r17=r1+r6|0;HEAP8[r4+1|0]=(HEAPU8[r2]+HEAPU8[r16]+HEAPU8[r15]+HEAPU8[r17]+2|0)>>>2&255;r15=r1+3|0;r2=r1+r7|0;HEAP8[r4+2|0]=(HEAPU8[r16]+HEAPU8[r15]+HEAPU8[r17]+HEAPU8[r2]+2|0)>>>2&255;r17=r1+4|0;r16=r1+r8|0;HEAP8[r4+3|0]=(HEAPU8[r15]+HEAPU8[r17]+HEAPU8[r2]+HEAPU8[r16]+2|0)>>>2&255;r2=r1+5|0;r15=r1+r9|0;HEAP8[r4+4|0]=(HEAPU8[r17]+HEAPU8[r2]+HEAPU8[r16]+HEAPU8[r15]+2|0)>>>2&255;r16=r1+6|0;r17=r1+r10|0;HEAP8[r4+5|0]=(HEAPU8[r2]+HEAPU8[r16]+HEAPU8[r15]+HEAPU8[r17]+2|0)>>>2&255;r15=r1+7|0;r2=r1+r11|0;HEAP8[r4+6|0]=(HEAPU8[r16]+HEAPU8[r15]+HEAPU8[r17]+HEAPU8[r2]+2|0)>>>2&255;HEAP8[r4+7|0]=(HEAPU8[r15]+HEAPU8[r1+8|0]+HEAPU8[r2]+HEAPU8[r1+r12|0]+2|0)>>>2&255;r2=r13-1|0;if((r2|0)==0){break}else{r13=r2;r4=r4+r3|0;r1=r14}}return}function _MC_avg_o_16_c(r1,r2,r3,r4){var r5;r5=r4;r4=r1;r1=r2;while(1){HEAP8[r4]=(HEAPU8[r1]+HEAPU8[r4]+1|0)>>>1&255;r2=r4+1|0;HEAP8[r2]=(HEAPU8[r1+1|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+2|0;HEAP8[r2]=(HEAPU8[r1+2|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+3|0;HEAP8[r2]=(HEAPU8[r1+3|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+4|0;HEAP8[r2]=(HEAPU8[r1+4|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+5|0;HEAP8[r2]=(HEAPU8[r1+5|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+6|0;HEAP8[r2]=(HEAPU8[r1+6|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+7|0;HEAP8[r2]=(HEAPU8[r1+7|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+8|0;HEAP8[r2]=(HEAPU8[r1+8|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+9|0;HEAP8[r2]=(HEAPU8[r1+9|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+10|0;HEAP8[r2]=(HEAPU8[r1+10|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+11|0;HEAP8[r2]=(HEAPU8[r1+11|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+12|0;HEAP8[r2]=(HEAPU8[r1+12|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+13|0;HEAP8[r2]=(HEAPU8[r1+13|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+14|0;HEAP8[r2]=(HEAPU8[r1+14|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+15|0;HEAP8[r2]=(HEAPU8[r1+15|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r5-1|0;if((r2|0)==0){break}else{r5=r2;r4=r4+r3|0;r1=r1+r3|0}}return}function _MC_avg_x_16_c(r1,r2,r3,r4){var r5,r6,r7;r5=r4;r4=r1;r1=r2;while(1){r2=r1+1|0;HEAP8[r4]=(HEAPU8[r4]+((HEAPU8[r1]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+2|0;r7=r4+1|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+3|0;r7=r4+2|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+4|0;r7=r4+3|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+5|0;r7=r4+4|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+6|0;r7=r4+5|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+7|0;r7=r4+6|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+8|0;r7=r4+7|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+9|0;r7=r4+8|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+10|0;r7=r4+9|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+11|0;r7=r4+10|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+12|0;r7=r4+11|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+13|0;r7=r4+12|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+14|0;r7=r4+13|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+15|0;r7=r4+14|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r4+15|0;HEAP8[r6]=(HEAPU8[r6]+((HEAPU8[r2]+HEAPU8[r1+16|0]+1|0)>>>1)+1|0)>>>1&255;r2=r5-1|0;if((r2|0)==0){break}else{r5=r2;r4=r4+r3|0;r1=r1+r3|0}}return}function _MC_avg_y_16_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r5=r3+1|0;r6=r3+2|0;r7=r3+3|0;r8=r3+4|0;r9=r3+5|0;r10=r3+6|0;r11=r3+7|0;r12=r3+8|0;r13=r3+9|0;r14=r3+10|0;r15=r3+11|0;r16=r3+12|0;r17=r3+13|0;r18=r3+14|0;r19=r3+15|0;r20=r4;r4=r1;r1=r2;while(1){r2=r1+r3|0;HEAP8[r4]=(HEAPU8[r4]+((HEAPU8[r1]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r21=r4+1|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+1|0]+HEAPU8[r1+r5|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+2|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+2|0]+HEAPU8[r1+r6|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+3|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+3|0]+HEAPU8[r1+r7|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+4|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+4|0]+HEAPU8[r1+r8|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+5|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+5|0]+HEAPU8[r1+r9|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+6|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+6|0]+HEAPU8[r1+r10|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+7|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+7|0]+HEAPU8[r1+r11|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+8|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+8|0]+HEAPU8[r1+r12|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+9|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+9|0]+HEAPU8[r1+r13|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+10|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+10|0]+HEAPU8[r1+r14|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+11|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+11|0]+HEAPU8[r1+r15|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+12|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+12|0]+HEAPU8[r1+r16|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+13|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+13|0]+HEAPU8[r1+r17|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+14|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+14|0]+HEAPU8[r1+r18|0]+1|0)>>>1)+1|0)>>>1&255;r21=r4+15|0;HEAP8[r21]=(HEAPU8[r21]+((HEAPU8[r1+15|0]+HEAPU8[r1+r19|0]+1|0)>>>1)+1|0)>>>1&255;r21=r20-1|0;if((r21|0)==0){break}else{r20=r21;r4=r4+r3|0;r1=r2}}return}function _MC_avg_xy_16_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r5=r3+1|0;r6=r3+2|0;r7=r3+3|0;r8=r3+4|0;r9=r3+5|0;r10=r3+6|0;r11=r3+7|0;r12=r3+8|0;r13=r3+9|0;r14=r3+10|0;r15=r3+11|0;r16=r3+12|0;r17=r3+13|0;r18=r3+14|0;r19=r3+15|0;r20=r3+16|0;r21=r4;r4=r1;r1=r2;while(1){r2=r1+1|0;r22=r1+r3|0;r23=r1+r5|0;HEAP8[r4]=(HEAPU8[r4]+((HEAPU8[r1]+HEAPU8[r2]+HEAPU8[r22]+HEAPU8[r23]+2|0)>>>2)+1|0)>>>1&255;r24=r1+2|0;r25=r1+r6|0;r26=r4+1|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+2|0)>>>2)+1|0)>>>1&255;r23=r1+3|0;r2=r1+r7|0;r26=r4+2|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+2|0)>>>2)+1|0)>>>1&255;r25=r1+4|0;r24=r1+r8|0;r26=r4+3|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+2|0)>>>2)+1|0)>>>1&255;r2=r1+5|0;r23=r1+r9|0;r26=r4+4|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+2|0)>>>2)+1|0)>>>1&255;r24=r1+6|0;r25=r1+r10|0;r26=r4+5|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+2|0)>>>2)+1|0)>>>1&255;r23=r1+7|0;r2=r1+r11|0;r26=r4+6|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+2|0)>>>2)+1|0)>>>1&255;r25=r1+8|0;r24=r1+r12|0;r26=r4+7|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+2|0)>>>2)+1|0)>>>1&255;r2=r1+9|0;r23=r1+r13|0;r26=r4+8|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+2|0)>>>2)+1|0)>>>1&255;r24=r1+10|0;r25=r1+r14|0;r26=r4+9|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+2|0)>>>2)+1|0)>>>1&255;r23=r1+11|0;r2=r1+r15|0;r26=r4+10|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+2|0)>>>2)+1|0)>>>1&255;r25=r1+12|0;r24=r1+r16|0;r26=r4+11|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+2|0)>>>2)+1|0)>>>1&255;r2=r1+13|0;r23=r1+r17|0;r26=r4+12|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r25]+HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+2|0)>>>2)+1|0)>>>1&255;r24=r1+14|0;r25=r1+r18|0;r26=r4+13|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r2]+HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+2|0)>>>2)+1|0)>>>1&255;r23=r1+15|0;r2=r1+r19|0;r26=r4+14|0;HEAP8[r26]=(HEAPU8[r26]+((HEAPU8[r24]+HEAPU8[r23]+HEAPU8[r25]+HEAPU8[r2]+2|0)>>>2)+1|0)>>>1&255;r25=r4+15|0;HEAP8[r25]=(HEAPU8[r25]+((HEAPU8[r23]+HEAPU8[r1+16|0]+HEAPU8[r2]+HEAPU8[r1+r20|0]+2|0)>>>2)+1|0)>>>1&255;r2=r21-1|0;if((r2|0)==0){break}else{r21=r2;r4=r4+r3|0;r1=r22}}return}function _MC_avg_o_8_c(r1,r2,r3,r4){var r5;r5=r4;r4=r1;r1=r2;while(1){HEAP8[r4]=(HEAPU8[r1]+HEAPU8[r4]+1|0)>>>1&255;r2=r4+1|0;HEAP8[r2]=(HEAPU8[r1+1|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+2|0;HEAP8[r2]=(HEAPU8[r1+2|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+3|0;HEAP8[r2]=(HEAPU8[r1+3|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+4|0;HEAP8[r2]=(HEAPU8[r1+4|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+5|0;HEAP8[r2]=(HEAPU8[r1+5|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+6|0;HEAP8[r2]=(HEAPU8[r1+6|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r4+7|0;HEAP8[r2]=(HEAPU8[r1+7|0]+HEAPU8[r2]+1|0)>>>1&255;r2=r5-1|0;if((r2|0)==0){break}else{r5=r2;r4=r4+r3|0;r1=r1+r3|0}}return}function _MC_avg_x_8_c(r1,r2,r3,r4){var r5,r6,r7;r5=r4;r4=r1;r1=r2;while(1){r2=r1+1|0;HEAP8[r4]=(HEAPU8[r4]+((HEAPU8[r1]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+2|0;r7=r4+1|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+3|0;r7=r4+2|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+4|0;r7=r4+3|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+5|0;r7=r4+4|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r1+6|0;r7=r4+5|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r2]+HEAPU8[r6]+1|0)>>>1)+1|0)>>>1&255;r2=r1+7|0;r7=r4+6|0;HEAP8[r7]=(HEAPU8[r7]+((HEAPU8[r6]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r6=r4+7|0;HEAP8[r6]=(HEAPU8[r6]+((HEAPU8[r2]+HEAPU8[r1+8|0]+1|0)>>>1)+1|0)>>>1&255;r2=r5-1|0;if((r2|0)==0){break}else{r5=r2;r4=r4+r3|0;r1=r1+r3|0}}return}function _MC_avg_y_8_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;r5=r3+1|0;r6=r3+2|0;r7=r3+3|0;r8=r3+4|0;r9=r3+5|0;r10=r3+6|0;r11=r3+7|0;r12=r4;r4=r1;r1=r2;while(1){r2=r1+r3|0;HEAP8[r4]=(HEAPU8[r4]+((HEAPU8[r1]+HEAPU8[r2]+1|0)>>>1)+1|0)>>>1&255;r13=r4+1|0;HEAP8[r13]=(HEAPU8[r13]+((HEAPU8[r1+1|0]+HEAPU8[r1+r5|0]+1|0)>>>1)+1|0)>>>1&255;r13=r4+2|0;HEAP8[r13]=(HEAPU8[r13]+((HEAPU8[r1+2|0]+HEAPU8[r1+r6|0]+1|0)>>>1)+1|0)>>>1&255;r13=r4+3|0;HEAP8[r13]=(HEAPU8[r13]+((HEAPU8[r1+3|0]+HEAPU8[r1+r7|0]+1|0)>>>1)+1|0)>>>1&255;r13=r4+4|0;HEAP8[r13]=(HEAPU8[r13]+((HEAPU8[r1+4|0]+HEAPU8[r1+r8|0]+1|0)>>>1)+1|0)>>>1&255;r13=r4+5|0;HEAP8[r13]=(HEAPU8[r13]+((HEAPU8[r1+5|0]+HEAPU8[r1+r9|0]+1|0)>>>1)+1|0)>>>1&255;r13=r4+6|0;HEAP8[r13]=(HEAPU8[r13]+((HEAPU8[r1+6|0]+HEAPU8[r1+r10|0]+1|0)>>>1)+1|0)>>>1&255;r13=r4+7|0;HEAP8[r13]=(HEAPU8[r13]+((HEAPU8[r1+7|0]+HEAPU8[r1+r11|0]+1|0)>>>1)+1|0)>>>1&255;r13=r12-1|0;if((r13|0)==0){break}else{r12=r13;r4=r4+r3|0;r1=r2}}return}function _MC_avg_xy_8_c(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r5=r3+1|0;r6=r3+2|0;r7=r3+3|0;r8=r3+4|0;r9=r3+5|0;r10=r3+6|0;r11=r3+7|0;r12=r3+8|0;r13=r4;r4=r1;r1=r2;while(1){r2=r1+1|0;r14=r1+r3|0;r15=r1+r5|0;HEAP8[r4]=(HEAPU8[r4]+((HEAPU8[r1]+HEAPU8[r2]+HEAPU8[r14]+HEAPU8[r15]+2|0)>>>2)+1|0)>>>1&255;r16=r1+2|0;r17=r1+r6|0;r18=r4+1|0;HEAP8[r18]=(HEAPU8[r18]+((HEAPU8[r2]+HEAPU8[r16]+HEAPU8[r15]+HEAPU8[r17]+2|0)>>>2)+1|0)>>>1&255;r15=r1+3|0;r2=r1+r7|0;r18=r4+2|0;HEAP8[r18]=(HEAPU8[r18]+((HEAPU8[r16]+HEAPU8[r15]+HEAPU8[r17]+HEAPU8[r2]+2|0)>>>2)+1|0)>>>1&255;r17=r1+4|0;r16=r1+r8|0;r18=r4+3|0;HEAP8[r18]=(HEAPU8[r18]+((HEAPU8[r15]+HEAPU8[r17]+HEAPU8[r2]+HEAPU8[r16]+2|0)>>>2)+1|0)>>>1&255;r2=r1+5|0;r15=r1+r9|0;r18=r4+4|0;HEAP8[r18]=(HEAPU8[r18]+((HEAPU8[r17]+HEAPU8[r2]+HEAPU8[r16]+HEAPU8[r15]+2|0)>>>2)+1|0)>>>1&255;r16=r1+6|0;r17=r1+r10|0;r18=r4+5|0;HEAP8[r18]=(HEAPU8[r18]+((HEAPU8[r2]+HEAPU8[r16]+HEAPU8[r15]+HEAPU8[r17]+2|0)>>>2)+1|0)>>>1&255;r15=r1+7|0;r2=r1+r11|0;r18=r4+6|0;HEAP8[r18]=(HEAPU8[r18]+((HEAPU8[r16]+HEAPU8[r15]+HEAPU8[r17]+HEAPU8[r2]+2|0)>>>2)+1|0)>>>1&255;r17=r4+7|0;HEAP8[r17]=(HEAPU8[r17]+((HEAPU8[r15]+HEAPU8[r1+8|0]+HEAPU8[r2]+HEAPU8[r1+r12|0]+2|0)>>>2)+1|0)>>>1&255;r2=r13-1|0;if((r2|0)==0){break}else{r13=r2;r4=r4+r3|0;r1=r14}}return}function _mpeg2_init_fbuf(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r5=r1>>2;r6=HEAP32[r5+11];r7=HEAP32[r5+4211];r8=(r7|0)==2;r9=r8&1;r10=r8?r6:0;r11=HEAP32[r5+4206];HEAP32[r5+96]=HEAP32[r2>>2]+r10|0;r12=r10>>1;HEAP32[r5+97]=HEAP32[r2+4>>2]+r12|0;HEAP32[r5+98]=HEAP32[r2+8>>2]+r12|0;HEAP32[r5+30]=HEAP32[r3>>2]+r10|0;HEAP32[r5+31]=HEAP32[r3+4>>2]+r12|0;HEAP32[r5+32]=HEAP32[r3+8>>2]+r12|0;HEAP32[r5+16]=HEAP32[r4>>2]+r10|0;r13=r4+4|0;HEAP32[r5+17]=HEAP32[r13>>2]+r12|0;r14=r4+8|0;HEAP32[r5+18]=HEAP32[r14>>2]+r12|0;r12=(r7|0)==3;if(r12){r15=r11;r16=r6}else{HEAP32[r5+101]=r8?1:-1;HEAP32[r5+36]=r1+(r9*12&-1)+120|0;r8=r9^1;HEAP32[r5+37]=r1+(r8*12&-1)+120|0;HEAP32[r5+22]=r1+(r9*12&-1)+64|0;HEAP32[r5+23]=r1+(r8*12&-1)+64|0;r8=r6-r10|0;if((HEAP32[r5+4217]|0)==0){r10=r3,r17=r10>>2}else{r10=(HEAP32[r5+4209]|0)==3?r3:r2,r17=r10>>2}HEAP32[r5+33]=HEAP32[r17]+r8|0;r10=r8>>1;HEAP32[r5+34]=HEAP32[r17+1]+r10|0;HEAP32[r5+35]=HEAP32[r17+2]+r10|0;HEAP32[r5+19]=HEAP32[r4>>2]+r8|0;HEAP32[r5+20]=HEAP32[r13>>2]+r10|0;HEAP32[r5+21]=HEAP32[r14>>2]+r10|0;r15=r11>>1;r16=r6<<1}HEAP32[r5+7]=r16;HEAP32[r5+8]=r16>>1;r6=r16<<4;HEAP32[r5+9]=r6;r16=HEAP32[r5+4208];HEAP32[r5+10]=r6>>2-r16;HEAP32[r5+12]=(HEAP32[r5+4205]<<1)-32|0;r6=r15<<1;HEAP32[r5+13]=r6-32|0;HEAP32[r5+14]=r6-16|0;HEAP32[r5+15]=r15-16|0;if((HEAP32[r5+4218]|0)!=0){HEAP32[r5+44]=114;HEAP32[r5+46]=18;HEAP32[r5+48]=130;return}r15=(r16|0)==0;if(r12){if(r15){HEAP32[r5+44]=114;HEAP32[r5+45]=92;HEAP32[r5+46]=38;HEAP32[r5+47]=16;HEAP32[r5+48]=130;return}r12=r1+176|0;if((r16|0)==1){HEAP32[r12>>2]=152;HEAP32[r5+45]=50;HEAP32[r5+46]=42;HEAP32[r5+47]=6;HEAP32[r5+48]=126;return}else{HEAP32[r12>>2]=116;HEAP32[r5+45]=104;HEAP32[r5+46]=142;HEAP32[r5+47]=108;HEAP32[r5+48]=148;return}}else{if(r15){HEAP32[r5+44]=114;HEAP32[r5+45]=82;HEAP32[r5+46]=158;HEAP32[r5+47]=90;HEAP32[r5+48]=130;return}r15=r1+176|0;if((r16|0)==1){HEAP32[r15>>2]=152;HEAP32[r5+45]=110;HEAP32[r5+46]=156;HEAP32[r5+47]=36;HEAP32[r5+48]=126;return}else{HEAP32[r15>>2]=116;HEAP32[r5+45]=146;HEAP32[r5+46]=138;HEAP32[r5+47]=64;HEAP32[r5+48]=148;return}}}function _motion_zero_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=(r2+32|0)>>2;HEAP32[r4]=0;HEAP32[r4+1]=0;HEAP32[r4+2]=0;HEAP32[r4+3]=0;r4=HEAP32[r3>>2];r5=(r1+24|0)>>2;r6=HEAP32[r5];r7=HEAP32[r1+12>>2]+r6|0;r8=r1+408|0;r9=HEAP32[r1+28>>2];r10=HEAP32[r2>>2]+Math.imul(r9,HEAP32[r8>>2])+r6|0;FUNCTION_TABLE[r4](r7,r10,r9,16);r9=HEAP32[r5]>>1;r10=r1+32|0;r7=HEAP32[r10>>2];r4=Math.imul(HEAP32[r8>>2]>>>1,r7)+r9|0;r8=r3+16|0;FUNCTION_TABLE[HEAP32[r8>>2]](HEAP32[r1+16>>2]+r9|0,HEAP32[r2+4>>2]+r4|0,r7,8);FUNCTION_TABLE[HEAP32[r8>>2]]((HEAP32[r5]>>1)+HEAP32[r1+20>>2]|0,HEAP32[r2+8>>2]+r4|0,HEAP32[r10>>2],8);return}function _motion_mp1(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r4=r1>>2;r5=(r1+4|0)>>2;r6=HEAP32[r5];if((r6|0)>0){r7=r1+8|0;r8=HEAP32[r7>>2];r9=r1|0;r10=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r9>>2];HEAP32[r9>>2]=r10;HEAP32[r7>>2]=r8+2|0;r8=r6-16|0;HEAP32[r5]=r8;r11=r8;r12=r10}else{r11=r6;r12=HEAP32[r4]}r6=r2+32|0;r10=HEAP32[r6>>2];r8=(r2+48|0)>>2;r7=HEAP32[r8];r9=(r1|0)>>2;do{if((r12|0)<0){HEAP32[r9]=r12<<1;HEAP32[r5]=r11+1|0;r13=0}else{if(r12>>>0>201326591){r14=r12>>>28;r15=(HEAPU8[(r14<<1)+5252668|0]<<r7)+1|0;r16=HEAPU8[(r14<<1)+5252669|0];HEAP32[r5]=r11+(r7+(r16+1))|0;r14=r12<<r16;r16=r14>>31;r17=r14<<1;HEAP32[r9]=r17;if((r7|0)==0){r18=r15}else{r18=(r17>>>((32-r7|0)>>>0))+r15|0}HEAP32[r9]=r17<<r7;r13=(r18^r16)-r16|0;break}r16=r12>>>22;r17=(HEAPU8[(r16<<1)+5252684|0]<<r7)+1|0;r15=HEAPU8[(r16<<1)+5252685|0];r16=r11+(r15+1)|0;HEAP32[r5]=r16;r14=r12<<r15;r15=r14>>31;r19=r14<<1;HEAP32[r9]=r19;if((r7|0)==0){r20=r17}else{if((r16|0)>0){r14=r1+8|0;r21=HEAP32[r14>>2];r22=(HEAPU8[r21]<<8|HEAPU8[r21+1|0])<<r16|r19;HEAP32[r9]=r22;HEAP32[r14>>2]=r21+2|0;r21=r16-16|0;HEAP32[r5]=r21;r23=r22;r24=r21}else{r23=r19;r24=r16}HEAP32[r9]=r23<<r7;HEAP32[r5]=r24+r7|0;r20=(r23>>>((32-r7|0)>>>0))+r17|0}r13=(r20^r15)-r15|0}}while(0);r20=r2+52|0;r7=HEAP32[r20>>2];r23=HEAP32[r8];r24=27-r7-r23|0;r12=(r13<<r7)+r10<<r24>>r24;HEAP32[r6>>2]=r12;r6=HEAP32[r5];if((r6|0)>0){r24=r1+8|0;r10=HEAP32[r24>>2];r7=(HEAPU8[r10]<<8|HEAPU8[r10+1|0])<<r6|HEAP32[r9];HEAP32[r9]=r7;HEAP32[r24>>2]=r10+2|0;r10=r6-16|0;HEAP32[r5]=r10;r25=HEAP32[r8];r26=r10;r27=r7}else{r25=r23;r26=r6;r27=HEAP32[r9]}r6=r2+36|0;r23=HEAP32[r6>>2];do{if((r27|0)<0){HEAP32[r9]=r27<<1;HEAP32[r5]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r7=r27>>>28;r10=(HEAPU8[(r7<<1)+5252668|0]<<r25)+1|0;r24=HEAPU8[(r7<<1)+5252669|0];HEAP32[r5]=r26+(r25+(r24+1))|0;r7=r27<<r24;r24=r7>>31;r13=r7<<1;HEAP32[r9]=r13;if((r25|0)==0){r29=r10}else{r29=(r13>>>((32-r25|0)>>>0))+r10|0}HEAP32[r9]=r13<<r25;r28=(r29^r24)-r24|0;break}r24=r27>>>22;r13=(HEAPU8[(r24<<1)+5252684|0]<<r25)+1|0;r10=HEAPU8[(r24<<1)+5252685|0];r24=r26+(r10+1)|0;HEAP32[r5]=r24;r7=r27<<r10;r10=r7>>31;r11=r7<<1;HEAP32[r9]=r11;if((r25|0)==0){r30=r13}else{if((r24|0)>0){r7=r1+8|0;r18=HEAP32[r7>>2];r15=(HEAPU8[r18]<<8|HEAPU8[r18+1|0])<<r24|r11;HEAP32[r9]=r15;HEAP32[r7>>2]=r18+2|0;r18=r24-16|0;HEAP32[r5]=r18;r31=r15;r32=r18}else{r31=r11;r32=r24}HEAP32[r9]=r31<<r25;HEAP32[r5]=r32+r25|0;r30=(r31>>>((32-r25|0)>>>0))+r13|0}r28=(r30^r10)-r10|0}}while(0);r30=HEAP32[r20>>2];r20=27-r30-HEAP32[r8]|0;r8=(r28<<r30)+r23<<r20>>r20;HEAP32[r6>>2]=r8;r6=(r1+24|0)>>2;r20=HEAP32[r6];r23=r20<<1;r30=r23+r12|0;r28=r1+408|0;r25=HEAP32[r28>>2]<<1;r31=r25+r8|0;r32=HEAP32[r4+12];if(r30>>>0>r32>>>0){r5=(r30|0)<0?0:r32;r33=r5;r34=r5-r23|0}else{r33=r30;r34=r12}r12=HEAP32[r4+13];if(r31>>>0>r12>>>0){r30=(r31|0)<0?0:r12;r35=r30;r36=r30-r25|0}else{r35=r31;r36=r8}r8=HEAP32[r3+((r35<<1&2|r33&1)<<2)>>2];r31=HEAP32[r4+7];r25=HEAP32[r4+3]+r20|0;r20=HEAP32[r2>>2]+Math.imul(r31,r35>>>1)+(r33>>>1)|0;FUNCTION_TABLE[r8](r25,r20,r31,16);r31=(r34|0)/2&-1;r34=(r36|0)/2&-1;r36=HEAP32[r6];r20=r1+32|0;r1=HEAP32[r20>>2];r25=(r36+r31>>1)+Math.imul((HEAP32[r28>>2]+r34|0)>>>1,r1)|0;r28=((r31&1|r34<<1&2|4)<<2)+r3|0;FUNCTION_TABLE[HEAP32[r28>>2]]((r36>>1)+HEAP32[r4+4]|0,HEAP32[r2+4>>2]+r25|0,r1,8);FUNCTION_TABLE[HEAP32[r28>>2]]((HEAP32[r6]>>1)+HEAP32[r4+5]|0,HEAP32[r2+8>>2]+r25|0,HEAP32[r20>>2],8);return}function _motion_reuse_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=r2>>2;r2=r1>>2;r5=HEAP32[r4+8];r6=HEAP32[r4+9];r7=(r1+24|0)>>2;r8=HEAP32[r7];r9=r8<<1;r10=r9+r5|0;r11=r1+408|0;r12=HEAP32[r11>>2]<<1;r13=r12+r6|0;r14=HEAP32[r2+12];if(r10>>>0>r14>>>0){r15=(r10|0)<0?0:r14;r16=r15-r9|0;r17=r15}else{r16=r5;r17=r10}r10=HEAP32[r2+13];if(r13>>>0>r10>>>0){r5=(r13|0)<0?0:r10;r18=r5-r12|0;r19=r5}else{r18=r6;r19=r13}r13=HEAP32[r3+((r19<<1&2|r17&1)<<2)>>2];r6=HEAP32[r2+7];r5=HEAP32[r2+3]+r8|0;r8=HEAP32[r4]+Math.imul(r6,r19>>>1)+(r17>>>1)|0;FUNCTION_TABLE[r13](r5,r8,r6,16);r6=(r16|0)/2&-1;r16=(r18|0)/2&-1;r18=HEAP32[r7];r8=r1+32|0;r1=HEAP32[r8>>2];r5=(r18+r6>>1)+Math.imul((HEAP32[r11>>2]+r16|0)>>>1,r1)|0;r11=((r6&1|r16<<1&2|4)<<2)+r3|0;FUNCTION_TABLE[HEAP32[r11>>2]]((r18>>1)+HEAP32[r2+4]|0,HEAP32[r4+1]+r5|0,r1,8);FUNCTION_TABLE[HEAP32[r11>>2]]((HEAP32[r7]>>1)+HEAP32[r2+5]|0,HEAP32[r4+2]+r5|0,HEAP32[r8>>2],8);return}function _motion_fr_field_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=r11>>>31;r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=(r2+48|0)>>2;r13=HEAP32[r12];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12]|0;r13=r14+r8<<r21>>r21;HEAP32[r6>>2]=r13;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2]>>1;r8=r2+52|0;r21=HEAP32[r8>>2];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r24=r27>>>28;r25=(HEAPU8[(r24<<1)+5252668|0]<<r21)+1|0;r7=HEAPU8[(r24<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r7+1))|0;r24=r27<<r7;r7=r24>>31;r10=r24<<1;HEAP32[r5]=r10;if((r21|0)==0){r29=r25}else{r29=(r10>>>((32-r21|0)>>>0))+r25|0}HEAP32[r5]=r10<<r21;r28=(r29^r7)-r7|0;break}r7=r27>>>22;r10=(HEAPU8[(r7<<1)+5252684|0]<<r21)+1|0;r25=HEAPU8[(r7<<1)+5252685|0];r7=r26+(r25+1)|0;HEAP32[r4]=r7;r24=r27<<r25;r25=r24>>31;r11=r24<<1;HEAP32[r5]=r11;if((r21|0)==0){r30=r10}else{if((r7|0)>0){r24=r1+8|0;r19=HEAP32[r24>>2];r16=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r7|r11;HEAP32[r5]=r16;HEAP32[r24>>2]=r19+2|0;r19=r7-16|0;HEAP32[r4]=r19;r31=r16;r32=r19}else{r31=r11;r32=r7}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r10|0}r28=(r30^r25)-r25|0}}while(0);r30=r28+r14|0;HEAP32[r6>>2]=r30<<1;r6=(r1+24|0)>>2;r14=HEAP32[r6];r28=r14<<1;r21=r28+r13|0;r31=(r1+408|0)>>2;r32=HEAP32[r31];r27=r32+r30|0;r26=r1+48|0;r29=HEAP32[r26>>2];if(r21>>>0>r29>>>0){r25=(r21|0)<0?0:r29;r33=r25;r34=r25-r28|0}else{r33=r21;r34=r13}r13=r1+60|0;r21=HEAP32[r13>>2];if(r27>>>0>r21>>>0){r28=(r27|0)<0?0:r21;r35=r28;r36=r28-r32|0}else{r35=r27;r36=r30}r30=HEAP32[r3+((r35<<1&2|r33&1)<<2)>>2];r27=(r1+12|0)>>2;r32=(r1+28|0)>>2;r28=HEAP32[r32];r21=HEAP32[r27]+r14|0;r14=(r2|0)>>2;r25=HEAP32[r14]+Math.imul(r28,r35&-2|r9)+(r33>>>1)|0;FUNCTION_TABLE[r30](r21,r25,r28<<1,8);r28=(r34|0)/2&-1;r34=(r36|0)/2&-1;r36=HEAP32[r6];r25=(r1+32|0)>>2;r21=HEAP32[r25];r30=(r36+r28>>1)+Math.imul((r34&-2|r9)+(HEAP32[r31]>>>1)|0,r21)|0;r9=((r28&1|r34<<1&2|4)<<2)+r3|0;r34=(r1+16|0)>>2;r28=(r2+4|0)>>2;FUNCTION_TABLE[HEAP32[r9>>2]]((r36>>1)+HEAP32[r34]|0,HEAP32[r28]+r30|0,r21<<1,4);r21=(r1+20|0)>>2;r36=(r2+8|0)>>2;FUNCTION_TABLE[HEAP32[r9>>2]]((HEAP32[r6]>>1)+HEAP32[r21]|0,HEAP32[r36]+r30|0,HEAP32[r25]<<1,4);r30=HEAP32[r4];if((r30|0)>0){r9=r1+8|0;r33=HEAP32[r9>>2];r35=(HEAPU8[r33]<<8|HEAPU8[r33+1|0])<<r30|HEAP32[r5];HEAP32[r5]=r35;HEAP32[r9>>2]=r33+2|0;r33=r30-16|0;HEAP32[r4]=r33;r37=r33;r38=r35}else{r37=r30;r38=HEAP32[r5]}r30=r38>>>31;r35=r38<<1;HEAP32[r5]=r35;HEAP32[r4]=r37+1|0;r33=r2+40|0;r9=HEAP32[r33>>2];r29=HEAP32[r12];do{if((r35|0)<0){HEAP32[r5]=r38<<2;HEAP32[r4]=r37+2|0;r39=0}else{if(r35>>>0>201326591){r10=r38>>>27&15;r7=(HEAPU8[(r10<<1)+5252668|0]<<r29)+1|0;r11=HEAPU8[(r10<<1)+5252669|0];HEAP32[r4]=r11+(r37+(r29+2))|0;r10=r35<<r11;r11=r10>>31;r19=r10<<1;HEAP32[r5]=r19;if((r29|0)==0){r40=r7}else{r40=(r19>>>((32-r29|0)>>>0))+r7|0}HEAP32[r5]=r19<<r29;r39=(r40^r11)-r11|0;break}r11=r38>>>21&1023;r19=(HEAPU8[(r11<<1)+5252684|0]<<r29)+1|0;r7=HEAPU8[(r11<<1)+5252685|0];r11=r7+(r37+2)|0;HEAP32[r4]=r11;r10=r35<<r7;r7=r10>>31;r16=r10<<1;HEAP32[r5]=r16;if((r29|0)==0){r41=r19}else{if((r11|0)>0){r10=r1+8|0;r24=HEAP32[r10>>2];r18=(HEAPU8[r24]<<8|HEAPU8[r24+1|0])<<r11|r16;HEAP32[r5]=r18;HEAP32[r10>>2]=r24+2|0;r24=r11-16|0;HEAP32[r4]=r24;r42=r18;r43=r24}else{r42=r16;r43=r11}HEAP32[r5]=r42<<r29;HEAP32[r4]=r43+r29|0;r41=(r42>>>((32-r29|0)>>>0))+r19|0}r39=(r41^r7)-r7|0}}while(0);r41=27-HEAP32[r12]|0;r12=r39+r9<<r41>>r41;HEAP32[r33>>2]=r12;r33=HEAP32[r4];if((r33|0)>0){r41=r1+8|0;r9=HEAP32[r41>>2];r39=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r33|HEAP32[r5];HEAP32[r5]=r39;HEAP32[r41>>2]=r9+2|0;r9=r33-16|0;HEAP32[r4]=r9;r44=r9;r45=r39}else{r44=r33;r45=HEAP32[r5]}r33=r2+44|0;r2=HEAP32[r33>>2]>>1;r39=HEAP32[r8>>2];do{if((r45|0)<0){HEAP32[r5]=r45<<1;HEAP32[r4]=r44+1|0;r46=0}else{if(r45>>>0>201326591){r8=r45>>>28;r9=(HEAPU8[(r8<<1)+5252668|0]<<r39)+1|0;r41=HEAPU8[(r8<<1)+5252669|0];HEAP32[r4]=r44+(r39+(r41+1))|0;r8=r45<<r41;r41=r8>>31;r29=r8<<1;HEAP32[r5]=r29;if((r39|0)==0){r47=r9}else{r47=(r29>>>((32-r39|0)>>>0))+r9|0}HEAP32[r5]=r29<<r39;r46=(r47^r41)-r41|0;break}r41=r45>>>22;r29=(HEAPU8[(r41<<1)+5252684|0]<<r39)+1|0;r9=HEAPU8[(r41<<1)+5252685|0];r41=r44+(r9+1)|0;HEAP32[r4]=r41;r8=r45<<r9;r9=r8>>31;r42=r8<<1;HEAP32[r5]=r42;if((r39|0)==0){r48=r29}else{if((r41|0)>0){r8=r1+8|0;r43=HEAP32[r8>>2];r35=(HEAPU8[r43]<<8|HEAPU8[r43+1|0])<<r41|r42;HEAP32[r5]=r35;HEAP32[r8>>2]=r43+2|0;r43=r41-16|0;HEAP32[r4]=r43;r49=r35;r50=r43}else{r49=r42;r50=r41}HEAP32[r5]=r49<<r39;HEAP32[r4]=r50+r39|0;r48=(r49>>>((32-r39|0)>>>0))+r29|0}r46=(r48^r9)-r9|0}}while(0);r48=r46+r2|0;HEAP32[r33>>2]=r48<<1;r33=HEAP32[r6];r2=r33<<1;r46=r2+r12|0;r39=HEAP32[r31];r49=r39+r48|0;r50=HEAP32[r26>>2];if(r46>>>0>r50>>>0){r26=(r46|0)<0?0:r50;r51=r26;r52=r26-r2|0}else{r51=r46;r52=r12}r12=HEAP32[r13>>2];if(r49>>>0<=r12>>>0){r53=r49;r54=r48;r55=r53<<1;r56=r55&2;r57=r51&1;r58=r56|r57;r59=(r58<<2)+r3|0;r60=HEAP32[r59>>2];r61=HEAP32[r27];r62=HEAP32[r32];r63=r33+r62|0;r64=r61+r63|0;r65=HEAP32[r14];r66=r51>>>1;r67=r53&-2;r68=r67|r30;r69=Math.imul(r62,r68);r70=r69+r66|0;r71=r65+r70|0;r72=r62<<1;FUNCTION_TABLE[r60](r64,r71,r72,8);r73=(r52|0)/2&-1;r74=(r54|0)/2&-1;r75=r74<<1;r76=r75&2;r77=r73&1;r78=HEAP32[r6];r79=r78+r73|0;r80=r79>>1;r81=HEAP32[r31];r82=r81>>>1;r83=r74&-2;r84=r83|r30;r85=r84+r82|0;r86=HEAP32[r25];r87=Math.imul(r85,r86);r88=r87+r80|0;r89=r77|r76;r90=r89|4;r91=(r90<<2)+r3|0,r92=r91>>2;r93=HEAP32[r92];r94=HEAP32[r34];r95=r78>>1;r96=r86+r95|0;r97=r94+r96|0;r98=HEAP32[r28];r99=r98+r88|0;r100=r86<<1;FUNCTION_TABLE[r93](r97,r99,r100,4);r101=HEAP32[r92];r102=HEAP32[r21];r103=HEAP32[r25];r104=HEAP32[r6];r105=r104>>1;r106=r105+r103|0;r107=r102+r106|0;r108=HEAP32[r36];r109=r108+r88|0;r110=r103<<1;FUNCTION_TABLE[r101](r107,r109,r110,4);return}r48=(r49|0)<0?0:r12;r53=r48;r54=r48-r39|0;r55=r53<<1;r56=r55&2;r57=r51&1;r58=r56|r57;r59=(r58<<2)+r3|0;r60=HEAP32[r59>>2];r61=HEAP32[r27];r62=HEAP32[r32];r63=r33+r62|0;r64=r61+r63|0;r65=HEAP32[r14];r66=r51>>>1;r67=r53&-2;r68=r67|r30;r69=Math.imul(r62,r68);r70=r69+r66|0;r71=r65+r70|0;r72=r62<<1;FUNCTION_TABLE[r60](r64,r71,r72,8);r73=(r52|0)/2&-1;r74=(r54|0)/2&-1;r75=r74<<1;r76=r75&2;r77=r73&1;r78=HEAP32[r6];r79=r78+r73|0;r80=r79>>1;r81=HEAP32[r31];r82=r81>>>1;r83=r74&-2;r84=r83|r30;r85=r84+r82|0;r86=HEAP32[r25];r87=Math.imul(r85,r86);r88=r87+r80|0;r89=r77|r76;r90=r89|4;r91=(r90<<2)+r3|0,r92=r91>>2;r93=HEAP32[r92];r94=HEAP32[r34];r95=r78>>1;r96=r86+r95|0;r97=r94+r96|0;r98=HEAP32[r28];r99=r98+r88|0;r100=r86<<1;FUNCTION_TABLE[r93](r97,r99,r100,4);r101=HEAP32[r92];r102=HEAP32[r21];r103=HEAP32[r25];r104=HEAP32[r6];r105=r104>>1;r106=r105+r103|0;r107=r102+r106|0;r108=HEAP32[r36];r109=r108+r88|0;r110=r103<<1;FUNCTION_TABLE[r101](r107,r109,r110,4);return}function _motion_fr_frame_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r4=r2>>2;r5=r1>>2;r6=(r1+4|0)>>2;r7=HEAP32[r6];if((r7|0)>0){r8=r1+8|0;r9=HEAP32[r8>>2];r10=r1|0;r11=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r7|HEAP32[r10>>2];HEAP32[r10>>2]=r11;HEAP32[r8>>2]=r9+2|0;r9=r7-16|0;HEAP32[r6]=r9;r12=r9;r13=r11}else{r12=r7;r13=HEAP32[r5]}r7=r2+32|0;r11=HEAP32[r7>>2];r9=r2+48|0;r8=HEAP32[r9>>2];r10=(r1|0)>>2;do{if((r13|0)<0){HEAP32[r10]=r13<<1;HEAP32[r6]=r12+1|0;r14=0}else{if(r13>>>0>201326591){r15=r13>>>28;r16=(HEAPU8[(r15<<1)+5252668|0]<<r8)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r6]=r12+(r8+(r17+1))|0;r15=r13<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r10]=r18;if((r8|0)==0){r19=r16}else{r19=(r18>>>((32-r8|0)>>>0))+r16|0}HEAP32[r10]=r18<<r8;r14=(r19^r17)-r17|0;break}r17=r13>>>22;r18=(HEAPU8[(r17<<1)+5252684|0]<<r8)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r12+(r16+1)|0;HEAP32[r6]=r17;r15=r13<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r10]=r20;if((r8|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r10]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r6]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r10]=r24<<r8;HEAP32[r6]=r25+r8|0;r21=(r24>>>((32-r8|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r9>>2]|0;r9=r14+r11<<r21>>r21;HEAP32[r7>>2]=r9;HEAP32[r4+10]=r9;r7=HEAP32[r6];if((r7|0)>0){r21=r1+8|0;r11=HEAP32[r21>>2];r14=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r7|HEAP32[r10];HEAP32[r10]=r14;HEAP32[r21>>2]=r11+2|0;r11=r7-16|0;HEAP32[r6]=r11;r26=r11;r27=r14}else{r26=r7;r27=HEAP32[r10]}r7=r2+36|0;r14=HEAP32[r7>>2];r11=r2+52|0;r2=HEAP32[r11>>2];do{if((r27|0)<0){HEAP32[r10]=r27<<1;HEAP32[r6]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r21=r27>>>28;r8=(HEAPU8[(r21<<1)+5252668|0]<<r2)+1|0;r24=HEAPU8[(r21<<1)+5252669|0];HEAP32[r6]=r26+(r2+(r24+1))|0;r21=r27<<r24;r24=r21>>31;r25=r21<<1;HEAP32[r10]=r25;if((r2|0)==0){r29=r8}else{r29=(r25>>>((32-r2|0)>>>0))+r8|0}HEAP32[r10]=r25<<r2;r28=(r29^r24)-r24|0;break}r24=r27>>>22;r25=(HEAPU8[(r24<<1)+5252684|0]<<r2)+1|0;r8=HEAPU8[(r24<<1)+5252685|0];r24=r26+(r8+1)|0;HEAP32[r6]=r24;r21=r27<<r8;r8=r21>>31;r13=r21<<1;HEAP32[r10]=r13;if((r2|0)==0){r30=r25}else{if((r24|0)>0){r21=r1+8|0;r12=HEAP32[r21>>2];r19=(HEAPU8[r12]<<8|HEAPU8[r12+1|0])<<r24|r13;HEAP32[r10]=r19;HEAP32[r21>>2]=r12+2|0;r12=r24-16|0;HEAP32[r6]=r12;r31=r19;r32=r12}else{r31=r13;r32=r24}HEAP32[r10]=r31<<r2;HEAP32[r6]=r32+r2|0;r30=(r31>>>((32-r2|0)>>>0))+r25|0}r28=(r30^r8)-r8|0}}while(0);r30=27-HEAP32[r11>>2]|0;r11=r28+r14<<r30>>r30;HEAP32[r7>>2]=r11;HEAP32[r4+11]=r11;r7=(r1+24|0)>>2;r30=HEAP32[r7];r14=r30<<1;r28=r14+r9|0;r2=r1+408|0;r31=HEAP32[r2>>2]<<1;r32=r31+r11|0;r6=HEAP32[r5+12];if(r28>>>0>r6>>>0){r10=(r28|0)<0?0:r6;r33=r10;r34=r10-r14|0}else{r33=r28;r34=r9}r9=HEAP32[r5+13];if(r32>>>0>r9>>>0){r28=(r32|0)<0?0:r9;r35=r28;r36=r28-r31|0}else{r35=r32;r36=r11}r11=HEAP32[r3+((r35<<1&2|r33&1)<<2)>>2];r32=HEAP32[r5+7];r31=HEAP32[r5+3]+r30|0;r30=HEAP32[r4]+Math.imul(r32,r35>>>1)+(r33>>>1)|0;FUNCTION_TABLE[r11](r31,r30,r32,16);r32=(r34|0)/2&-1;r34=(r36|0)/2&-1;r36=HEAP32[r7];r30=r1+32|0;r1=HEAP32[r30>>2];r31=(r36+r32>>1)+Math.imul((HEAP32[r2>>2]+r34|0)>>>1,r1)|0;r2=((r32&1|r34<<1&2|4)<<2)+r3|0;FUNCTION_TABLE[HEAP32[r2>>2]]((r36>>1)+HEAP32[r5+4]|0,HEAP32[r4+1]+r31|0,r1,8);FUNCTION_TABLE[HEAP32[r2>>2]]((HEAP32[r7]>>1)+HEAP32[r5+5]|0,HEAP32[r4+2]+r31|0,HEAP32[r30>>2],8);return}function _motion_fr_dmv_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125;r3=(r1+4|0)>>2;r4=HEAP32[r3];if((r4|0)>0){r5=r1+8|0;r6=HEAP32[r5>>2];r7=r1|0;r8=(HEAPU8[r6]<<8|HEAPU8[r6+1|0])<<r4|HEAP32[r7>>2];HEAP32[r7>>2]=r8;HEAP32[r5>>2]=r6+2|0;r6=r4-16|0;HEAP32[r3]=r6;r9=r6;r10=r8}else{r9=r4;r10=HEAP32[r1>>2]}r4=r2+32|0;r8=HEAP32[r4>>2];r6=r2+48|0;r5=HEAP32[r6>>2];r7=(r1|0)>>2;do{if((r10|0)<0){HEAP32[r7]=r10<<1;HEAP32[r3]=r9+1|0;r11=0}else{if(r10>>>0>201326591){r12=r10>>>28;r13=(HEAPU8[(r12<<1)+5252668|0]<<r5)+1|0;r14=HEAPU8[(r12<<1)+5252669|0];HEAP32[r3]=r9+(r5+(r14+1))|0;r12=r10<<r14;r14=r12>>31;r15=r12<<1;HEAP32[r7]=r15;if((r5|0)==0){r16=r13}else{r16=(r15>>>((32-r5|0)>>>0))+r13|0}HEAP32[r7]=r15<<r5;r11=(r16^r14)-r14|0;break}r14=r10>>>22;r15=(HEAPU8[(r14<<1)+5252684|0]<<r5)+1|0;r13=HEAPU8[(r14<<1)+5252685|0];r14=r9+(r13+1)|0;HEAP32[r3]=r14;r12=r10<<r13;r13=r12>>31;r17=r12<<1;HEAP32[r7]=r17;if((r5|0)==0){r18=r15}else{if((r14|0)>0){r12=r1+8|0;r19=HEAP32[r12>>2];r20=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r14|r17;HEAP32[r7]=r20;HEAP32[r12>>2]=r19+2|0;r19=r14-16|0;HEAP32[r3]=r19;r21=r20;r22=r19}else{r21=r17;r22=r14}HEAP32[r7]=r21<<r5;HEAP32[r3]=r22+r5|0;r18=(r21>>>((32-r5|0)>>>0))+r15|0}r11=(r18^r13)-r13|0}}while(0);r18=27-HEAP32[r6>>2]|0;r6=r11+r8<<r18>>r18;HEAP32[r4>>2]=r6;HEAP32[r2+40>>2]=r6;r4=HEAP32[r3];if((r4|0)>0){r18=r1+8|0;r8=HEAP32[r18>>2];r11=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r4|HEAP32[r7];HEAP32[r7]=r11;HEAP32[r18>>2]=r8+2|0;r8=r4-16|0;HEAP32[r3]=r8;r23=r8;r24=r11}else{r23=r4;r24=HEAP32[r7]}r4=r24>>>30;r11=HEAPU8[(r4<<1)+5253245|0];r8=r24<<r11;HEAP32[r7]=r8;r24=r23+r11|0;HEAP32[r3]=r24;r11=HEAP8[(r4<<1)+5253244|0]<<24>>24;r4=r2+36|0;r23=HEAP32[r4>>2]>>1;r18=HEAP32[r2+52>>2];do{if((r8|0)<0){HEAP32[r7]=r8<<1;HEAP32[r3]=r24+1|0;r25=0}else{if(r8>>>0>201326591){r5=r8>>>28;r21=(HEAPU8[(r5<<1)+5252668|0]<<r18)+1|0;r22=HEAPU8[(r5<<1)+5252669|0];HEAP32[r3]=r22+(r24+(r18+1))|0;r5=r8<<r22;r22=r5>>31;r10=r5<<1;HEAP32[r7]=r10;if((r18|0)==0){r26=r21}else{r26=(r10>>>((32-r18|0)>>>0))+r21|0}HEAP32[r7]=r10<<r18;r25=(r26^r22)-r22|0;break}r22=r8>>>22;r10=(HEAPU8[(r22<<1)+5252684|0]<<r18)+1|0;r21=HEAPU8[(r22<<1)+5252685|0];r22=r21+(r24+1)|0;HEAP32[r3]=r22;r5=r8<<r21;r21=r5>>31;r9=r5<<1;HEAP32[r7]=r9;if((r18|0)==0){r27=r10}else{if((r22|0)>0){r5=r1+8|0;r16=HEAP32[r5>>2];r13=(HEAPU8[r16]<<8|HEAPU8[r16+1|0])<<r22|r9;HEAP32[r7]=r13;HEAP32[r5>>2]=r16+2|0;r16=r22-16|0;HEAP32[r3]=r16;r28=r13;r29=r16}else{r28=r9;r29=r22}HEAP32[r7]=r28<<r18;HEAP32[r3]=r29+r18|0;r27=(r28>>>((32-r18|0)>>>0))+r10|0}r25=(r27^r21)-r21|0}}while(0);r27=r25+r23|0;r23=r27<<1;HEAP32[r4>>2]=r23;HEAP32[r2+44>>2]=r23;r23=HEAP32[r7];r4=r23>>>30;r25=HEAPU8[(r4<<1)+5253245|0];HEAP32[r7]=r23<<r25;HEAP32[r3]=HEAP32[r3]+r25|0;r25=HEAP8[(r4<<1)+5253244|0]<<24>>24;r4=r1+16860|0;r3=(HEAP32[r4>>2]|0)!=0?1:3;r23=(r6|0)>0&1;r7=(Math.imul(r3,r6)+r23>>1)+r11|0;r18=(r27|0)>0&1;r28=(Math.imul(r3,r27)+r18>>1)+(r25-1)|0;r3=(r1+24|0)>>2;r29=HEAP32[r3];r8=r29<<1;r24=r7+r8|0;r26=(r1+408|0)>>2;r21=HEAP32[r26];r10=r28+r21|0;r22=(r1+48|0)>>2;r9=HEAP32[r22];if(r24>>>0>r9>>>0){r16=(r24|0)<0?0:r9;r30=r16;r31=r16-r8|0}else{r30=r24;r31=r7}r7=(r1+60|0)>>2;r24=HEAP32[r7];if(r10>>>0>r24>>>0){r8=(r10|0)<0?0:r24;r32=r8;r33=r8-r21|0}else{r32=r10;r33=r28}r28=HEAP32[((r32<<1&2|r30&1)<<2)+5243300>>2];r10=(r1+12|0)>>2;r21=(r1+28|0)>>2;r8=HEAP32[r21];r24=HEAP32[r10]+r29|0;r29=(r2|0)>>2;r16=HEAP32[r29]+Math.imul(r8,r32|1)+(r30>>>1)|0;FUNCTION_TABLE[r28](r24,r16,r8<<1,8);r8=(r31|0)/2&-1;r31=(r33|0)/2&-1;r33=HEAP32[r3];r16=(r1+32|0)>>2;r24=HEAP32[r16];r28=(r33+r8>>1)+Math.imul((HEAP32[r26]>>>1)+(r31|1)|0,r24)|0;r30=((r8&1|r31<<1&2|4)<<2)+5243300|0;r31=(r1+16|0)>>2;r8=(r2+4|0)>>2;FUNCTION_TABLE[HEAP32[r30>>2]]((r33>>1)+HEAP32[r31]|0,HEAP32[r8]+r28|0,r24<<1,4);r24=(r1+20|0)>>2;r1=(r2+8|0)>>2;FUNCTION_TABLE[HEAP32[r30>>2]]((HEAP32[r3]>>1)+HEAP32[r24]|0,HEAP32[r1]+r28|0,HEAP32[r16]<<1,4);r28=(HEAP32[r4>>2]|0)!=0?3:1;r4=(Math.imul(r28,r6)+r23>>1)+r11|0;r11=(Math.imul(r28,r27)+r18+2>>1)+r25|0;r25=HEAP32[r3];r18=r25<<1;r28=r4+r18|0;r23=HEAP32[r26];r30=r11+r23|0;r2=HEAP32[r22];if(r28>>>0>r2>>>0){r33=(r28|0)<0?0:r2;r34=r33;r35=r33-r18|0}else{r34=r28;r35=r4}r4=HEAP32[r7];if(r30>>>0>r4>>>0){r28=(r30|0)<0?0:r4;r36=r28;r37=r28-r23|0}else{r36=r30;r37=r11}r11=HEAP32[((r36<<1&2|r34&1)<<2)+5243300>>2];r30=HEAP32[r21];r23=HEAP32[r10]+r25+r30|0;r25=HEAP32[r29]+Math.imul(r30,r36&-2)+(r34>>>1)|0;FUNCTION_TABLE[r11](r23,r25,r30<<1,8);r30=(r35|0)/2&-1;r35=(r37|0)/2&-1;r37=HEAP32[r3];r25=HEAP32[r16];r23=(r37+r30>>1)+Math.imul((HEAP32[r26]>>>1)+(r35&-2)|0,r25)|0;r11=((r30&1|r35<<1&2|4)<<2)+5243300|0;FUNCTION_TABLE[HEAP32[r11>>2]]((r37>>1)+HEAP32[r31]+r25|0,HEAP32[r8]+r23|0,r25<<1,4);r25=HEAP32[r16];FUNCTION_TABLE[HEAP32[r11>>2]]((HEAP32[r3]>>1)+HEAP32[r24]+r25|0,HEAP32[r1]+r23|0,r25<<1,4);r25=HEAP32[r3];r23=r25<<1;r11=r23+r6|0;r37=HEAP32[r26];r35=r37+r27|0;r30=HEAP32[r22];if(r11>>>0>r30>>>0){r22=(r11|0)<0?0:r30;r38=r22;r39=r22-r23|0}else{r38=r11;r39=r6}r6=HEAP32[r7];if(r35>>>0<=r6>>>0){r40=r35;r41=r27;r42=r40<<1;r43=r42&2;r44=r38&1;r45=r43|r44;r46=r38>>>1;r47=r40&-2;r48=HEAP32[r21];r49=Math.imul(r47,r48);r50=r49+r46|0;r51=(r45<<2)+5243332|0,r52=r51>>2;r53=HEAP32[r52];r54=HEAP32[r10];r55=r54+r25|0;r56=HEAP32[r29];r57=r56+r50|0;r58=r48<<1;FUNCTION_TABLE[r53](r55,r57,r58,8);r59=HEAP32[r52];r60=HEAP32[r10];r61=HEAP32[r21];r62=HEAP32[r3];r63=r62+r61|0;r64=r60+r63|0;r65=HEAP32[r29];r66=r61+r50|0;r67=r65+r66|0;r68=r61<<1;FUNCTION_TABLE[r59](r64,r67,r68,8);r69=(r39|0)/2&-1;r70=(r41|0)/2&-1;r71=r70<<1;r72=r71&2;r73=r69&1;r74=HEAP32[r3];r75=r74+r69|0;r76=r75>>1;r77=HEAP32[r26];r78=r77>>>1;r79=r70&-2;r80=r78+r79|0;r81=HEAP32[r16];r82=Math.imul(r80,r81);r83=r82+r76|0;r84=r73|r72;r85=r84|4;r86=(r85<<2)+5243332|0,r87=r86>>2;r88=HEAP32[r87];r89=HEAP32[r31];r90=r74>>1;r91=r89+r90|0;r92=HEAP32[r8];r93=r92+r83|0;r94=r81<<1;FUNCTION_TABLE[r88](r91,r93,r94,4);r95=HEAP32[r87];r96=HEAP32[r31];r97=HEAP32[r16];r98=HEAP32[r3];r99=r98>>1;r100=r99+r97|0;r101=r96+r100|0;r102=HEAP32[r8];r103=r97+r83|0;r104=r102+r103|0;r105=r97<<1;FUNCTION_TABLE[r95](r101,r104,r105,4);r106=HEAP32[r87];r107=HEAP32[r24];r108=HEAP32[r3];r109=r108>>1;r110=r107+r109|0;r111=HEAP32[r1];r112=r111+r83|0;r113=HEAP32[r16];r114=r113<<1;FUNCTION_TABLE[r106](r110,r112,r114,4);r115=HEAP32[r87];r116=HEAP32[r24];r117=HEAP32[r16];r118=HEAP32[r3];r119=r118>>1;r120=r119+r117|0;r121=r116+r120|0;r122=HEAP32[r1];r123=r117+r83|0;r124=r122+r123|0;r125=r117<<1;FUNCTION_TABLE[r115](r121,r124,r125,4);return}r27=(r35|0)<0?0:r6;r40=r27;r41=r27-r37|0;r42=r40<<1;r43=r42&2;r44=r38&1;r45=r43|r44;r46=r38>>>1;r47=r40&-2;r48=HEAP32[r21];r49=Math.imul(r47,r48);r50=r49+r46|0;r51=(r45<<2)+5243332|0,r52=r51>>2;r53=HEAP32[r52];r54=HEAP32[r10];r55=r54+r25|0;r56=HEAP32[r29];r57=r56+r50|0;r58=r48<<1;FUNCTION_TABLE[r53](r55,r57,r58,8);r59=HEAP32[r52];r60=HEAP32[r10];r61=HEAP32[r21];r62=HEAP32[r3];r63=r62+r61|0;r64=r60+r63|0;r65=HEAP32[r29];r66=r61+r50|0;r67=r65+r66|0;r68=r61<<1;FUNCTION_TABLE[r59](r64,r67,r68,8);r69=(r39|0)/2&-1;r70=(r41|0)/2&-1;r71=r70<<1;r72=r71&2;r73=r69&1;r74=HEAP32[r3];r75=r74+r69|0;r76=r75>>1;r77=HEAP32[r26];r78=r77>>>1;r79=r70&-2;r80=r78+r79|0;r81=HEAP32[r16];r82=Math.imul(r80,r81);r83=r82+r76|0;r84=r73|r72;r85=r84|4;r86=(r85<<2)+5243332|0,r87=r86>>2;r88=HEAP32[r87];r89=HEAP32[r31];r90=r74>>1;r91=r89+r90|0;r92=HEAP32[r8];r93=r92+r83|0;r94=r81<<1;FUNCTION_TABLE[r88](r91,r93,r94,4);r95=HEAP32[r87];r96=HEAP32[r31];r97=HEAP32[r16];r98=HEAP32[r3];r99=r98>>1;r100=r99+r97|0;r101=r96+r100|0;r102=HEAP32[r8];r103=r97+r83|0;r104=r102+r103|0;r105=r97<<1;FUNCTION_TABLE[r95](r101,r104,r105,4);r106=HEAP32[r87];r107=HEAP32[r24];r108=HEAP32[r3];r109=r108>>1;r110=r107+r109|0;r111=HEAP32[r1];r112=r111+r83|0;r113=HEAP32[r16];r114=r113<<1;FUNCTION_TABLE[r106](r110,r112,r114,4);r115=HEAP32[r87];r116=HEAP32[r24];r117=HEAP32[r16];r118=HEAP32[r3];r119=r118>>1;r120=r119+r117|0;r121=r116+r120|0;r122=HEAP32[r1];r123=r117+r83|0;r124=r122+r123|0;r125=r117<<1;FUNCTION_TABLE[r115](r121,r124,r125,4);return}function _motion_zero_422(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r1>>2;r5=(r1+24|0)>>2;r6=(r2+32|0)>>2;HEAP32[r6]=0;HEAP32[r6+1]=0;HEAP32[r6+2]=0;HEAP32[r6+3]=0;r6=HEAP32[r5];r7=HEAP32[r4+7];r8=Math.imul(r7,HEAP32[r4+102])+r6|0;FUNCTION_TABLE[HEAP32[r3>>2]](HEAP32[r4+3]+r6|0,HEAP32[r2>>2]+r8|0,r7,16);r7=r8>>>1;r8=r3+16|0;r3=r1+32|0;FUNCTION_TABLE[HEAP32[r8>>2]]((HEAP32[r5]>>1)+HEAP32[r4+4]|0,HEAP32[r2+4>>2]+r7|0,HEAP32[r3>>2],16);FUNCTION_TABLE[HEAP32[r8>>2]]((HEAP32[r5]>>1)+HEAP32[r4+5]|0,HEAP32[r2+8>>2]+r7|0,HEAP32[r3>>2],16);return}function _motion_fr_field_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=r11>>>31;r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=(r2+48|0)>>2;r13=HEAP32[r12];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12]|0;r13=r14+r8<<r21>>r21;HEAP32[r6>>2]=r13;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2]>>1;r8=r2+52|0;r21=HEAP32[r8>>2];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r24=r27>>>28;r25=(HEAPU8[(r24<<1)+5252668|0]<<r21)+1|0;r7=HEAPU8[(r24<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r7+1))|0;r24=r27<<r7;r7=r24>>31;r10=r24<<1;HEAP32[r5]=r10;if((r21|0)==0){r29=r25}else{r29=(r10>>>((32-r21|0)>>>0))+r25|0}HEAP32[r5]=r10<<r21;r28=(r29^r7)-r7|0;break}r7=r27>>>22;r10=(HEAPU8[(r7<<1)+5252684|0]<<r21)+1|0;r25=HEAPU8[(r7<<1)+5252685|0];r7=r26+(r25+1)|0;HEAP32[r4]=r7;r24=r27<<r25;r25=r24>>31;r11=r24<<1;HEAP32[r5]=r11;if((r21|0)==0){r30=r10}else{if((r7|0)>0){r24=r1+8|0;r19=HEAP32[r24>>2];r16=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r7|r11;HEAP32[r5]=r16;HEAP32[r24>>2]=r19+2|0;r19=r7-16|0;HEAP32[r4]=r19;r31=r16;r32=r19}else{r31=r11;r32=r7}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r10|0}r28=(r30^r25)-r25|0}}while(0);r30=r28+r14|0;HEAP32[r6>>2]=r30<<1;r6=(r1+24|0)>>2;r14=HEAP32[r6];r28=r14<<1;r21=r28+r13|0;r31=r1+408|0;r32=HEAP32[r31>>2]+r30|0;r30=r1+48|0;r27=HEAP32[r30>>2];if(r21>>>0>r27>>>0){r26=(r21|0)<0?0:r27;r33=r26;r34=r26-r28|0}else{r33=r21;r34=r13}r13=r1+60|0;r21=HEAP32[r13>>2];if(r32>>>0>r21>>>0){r35=(r32|0)<0?0:r21}else{r35=r32}r32=r35<<1&2;r21=(r1+28|0)>>2;r28=HEAP32[r21];r26=Math.imul(r35&-2|r9,r28)+(r33>>>1)|0;r9=(r1+12|0)>>2;r35=(r2|0)>>2;FUNCTION_TABLE[HEAP32[r3+((r32|r33&1)<<2)>>2]](HEAP32[r9]+r14|0,HEAP32[r35]+r26|0,r28<<1,8);r28=(r26+(r34>>>31&r34)|0)>>>1;r26=((r32|(r34|0)/2&-1&1|4)<<2)+r3|0;r34=(r1+16|0)>>2;r32=(r1+32|0)>>2;r14=(r2+4|0)>>2;FUNCTION_TABLE[HEAP32[r26>>2]]((HEAP32[r6]>>1)+HEAP32[r34]|0,HEAP32[r14]+r28|0,HEAP32[r32]<<1,8);r33=(r1+20|0)>>2;r27=(r2+8|0)>>2;FUNCTION_TABLE[HEAP32[r26>>2]]((HEAP32[r6]>>1)+HEAP32[r33]|0,HEAP32[r27]+r28|0,HEAP32[r32]<<1,8);r28=HEAP32[r4];if((r28|0)>0){r26=r1+8|0;r29=HEAP32[r26>>2];r25=(HEAPU8[r29]<<8|HEAPU8[r29+1|0])<<r28|HEAP32[r5];HEAP32[r5]=r25;HEAP32[r26>>2]=r29+2|0;r29=r28-16|0;HEAP32[r4]=r29;r36=r29;r37=r25}else{r36=r28;r37=HEAP32[r5]}r28=r37>>>31;r25=r37<<1;HEAP32[r5]=r25;HEAP32[r4]=r36+1|0;r29=r2+40|0;r26=HEAP32[r29>>2];r10=HEAP32[r12];do{if((r25|0)<0){HEAP32[r5]=r37<<2;HEAP32[r4]=r36+2|0;r38=0}else{if(r25>>>0>201326591){r7=r37>>>27&15;r11=(HEAPU8[(r7<<1)+5252668|0]<<r10)+1|0;r19=HEAPU8[(r7<<1)+5252669|0];HEAP32[r4]=r19+(r36+(r10+2))|0;r7=r25<<r19;r19=r7>>31;r16=r7<<1;HEAP32[r5]=r16;if((r10|0)==0){r39=r11}else{r39=(r16>>>((32-r10|0)>>>0))+r11|0}HEAP32[r5]=r16<<r10;r38=(r39^r19)-r19|0;break}r19=r37>>>21&1023;r16=(HEAPU8[(r19<<1)+5252684|0]<<r10)+1|0;r11=HEAPU8[(r19<<1)+5252685|0];r19=r11+(r36+2)|0;HEAP32[r4]=r19;r7=r25<<r11;r11=r7>>31;r24=r7<<1;HEAP32[r5]=r24;if((r10|0)==0){r40=r16}else{if((r19|0)>0){r7=r1+8|0;r18=HEAP32[r7>>2];r17=(HEAPU8[r18]<<8|HEAPU8[r18+1|0])<<r19|r24;HEAP32[r5]=r17;HEAP32[r7>>2]=r18+2|0;r18=r19-16|0;HEAP32[r4]=r18;r41=r17;r42=r18}else{r41=r24;r42=r19}HEAP32[r5]=r41<<r10;HEAP32[r4]=r42+r10|0;r40=(r41>>>((32-r10|0)>>>0))+r16|0}r38=(r40^r11)-r11|0}}while(0);r40=27-HEAP32[r12]|0;r12=r38+r26<<r40>>r40;HEAP32[r29>>2]=r12;r29=HEAP32[r4];if((r29|0)>0){r40=r1+8|0;r26=HEAP32[r40>>2];r38=(HEAPU8[r26]<<8|HEAPU8[r26+1|0])<<r29|HEAP32[r5];HEAP32[r5]=r38;HEAP32[r40>>2]=r26+2|0;r26=r29-16|0;HEAP32[r4]=r26;r43=r26;r44=r38}else{r43=r29;r44=HEAP32[r5]}r29=r2+44|0;r2=HEAP32[r29>>2]>>1;r38=HEAP32[r8>>2];do{if((r44|0)<0){HEAP32[r5]=r44<<1;HEAP32[r4]=r43+1|0;r45=0}else{if(r44>>>0>201326591){r8=r44>>>28;r26=(HEAPU8[(r8<<1)+5252668|0]<<r38)+1|0;r40=HEAPU8[(r8<<1)+5252669|0];HEAP32[r4]=r43+(r38+(r40+1))|0;r8=r44<<r40;r40=r8>>31;r10=r8<<1;HEAP32[r5]=r10;if((r38|0)==0){r46=r26}else{r46=(r10>>>((32-r38|0)>>>0))+r26|0}HEAP32[r5]=r10<<r38;r45=(r46^r40)-r40|0;break}r40=r44>>>22;r10=(HEAPU8[(r40<<1)+5252684|0]<<r38)+1|0;r26=HEAPU8[(r40<<1)+5252685|0];r40=r43+(r26+1)|0;HEAP32[r4]=r40;r8=r44<<r26;r26=r8>>31;r41=r8<<1;HEAP32[r5]=r41;if((r38|0)==0){r47=r10}else{if((r40|0)>0){r8=r1+8|0;r42=HEAP32[r8>>2];r25=(HEAPU8[r42]<<8|HEAPU8[r42+1|0])<<r40|r41;HEAP32[r5]=r25;HEAP32[r8>>2]=r42+2|0;r42=r40-16|0;HEAP32[r4]=r42;r48=r25;r49=r42}else{r48=r41;r49=r40}HEAP32[r5]=r48<<r38;HEAP32[r4]=r49+r38|0;r47=(r48>>>((32-r38|0)>>>0))+r10|0}r45=(r47^r26)-r26|0}}while(0);r47=r45+r2|0;HEAP32[r29>>2]=r47<<1;r29=HEAP32[r6];r2=r29<<1;r45=r2+r12|0;r38=HEAP32[r31>>2]+r47|0;r47=HEAP32[r30>>2];if(r45>>>0>r47>>>0){r30=(r45|0)<0?0:r47;r50=r30;r51=r30-r2|0}else{r50=r45;r51=r12}r12=HEAP32[r13>>2];if(r38>>>0<=r12>>>0){r52=r38;r53=r52<<1;r54=r53&2;r55=r50&1;r56=r54|r55;r57=r50>>>1;r58=r52&-2;r59=r58|r28;r60=HEAP32[r21];r61=Math.imul(r59,r60);r62=r61+r57|0;r63=(r56<<2)+r3|0;r64=HEAP32[r63>>2];r65=HEAP32[r9];r66=r29+r60|0;r67=r65+r66|0;r68=HEAP32[r35];r69=r68+r62|0;r70=r60<<1;FUNCTION_TABLE[r64](r67,r69,r70,8);r71=r51>>>31;r72=r71&r51;r73=r62+r72|0;r74=r73>>>1;r75=(r51|0)/2&-1;r76=r75&1;r77=r54|r76;r78=r77|4;r79=(r78<<2)+r3|0,r80=r79>>2;r81=HEAP32[r80];r82=HEAP32[r34];r83=HEAP32[r32];r84=HEAP32[r6];r85=r84>>1;r86=r85+r83|0;r87=r82+r86|0;r88=HEAP32[r14];r89=r88+r74|0;r90=r83<<1;FUNCTION_TABLE[r81](r87,r89,r90,8);r91=HEAP32[r80];r92=HEAP32[r33];r93=HEAP32[r32];r94=HEAP32[r6];r95=r94>>1;r96=r95+r93|0;r97=r92+r96|0;r98=HEAP32[r27];r99=r98+r74|0;r100=r93<<1;FUNCTION_TABLE[r91](r97,r99,r100,8);return}r52=(r38|0)<0?0:r12;r53=r52<<1;r54=r53&2;r55=r50&1;r56=r54|r55;r57=r50>>>1;r58=r52&-2;r59=r58|r28;r60=HEAP32[r21];r61=Math.imul(r59,r60);r62=r61+r57|0;r63=(r56<<2)+r3|0;r64=HEAP32[r63>>2];r65=HEAP32[r9];r66=r29+r60|0;r67=r65+r66|0;r68=HEAP32[r35];r69=r68+r62|0;r70=r60<<1;FUNCTION_TABLE[r64](r67,r69,r70,8);r71=r51>>>31;r72=r71&r51;r73=r62+r72|0;r74=r73>>>1;r75=(r51|0)/2&-1;r76=r75&1;r77=r54|r76;r78=r77|4;r79=(r78<<2)+r3|0,r80=r79>>2;r81=HEAP32[r80];r82=HEAP32[r34];r83=HEAP32[r32];r84=HEAP32[r6];r85=r84>>1;r86=r85+r83|0;r87=r82+r86|0;r88=HEAP32[r14];r89=r88+r74|0;r90=r83<<1;FUNCTION_TABLE[r81](r87,r89,r90,8);r91=HEAP32[r80];r92=HEAP32[r33];r93=HEAP32[r32];r94=HEAP32[r6];r95=r94>>1;r96=r95+r93|0;r97=r92+r96|0;r98=HEAP32[r27];r99=r98+r74|0;r100=r93<<1;FUNCTION_TABLE[r91](r97,r99,r100,8);return}function _motion_fr_frame_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=r2+32|0;r9=HEAP32[r5>>2];r7=r2+48|0;r6=HEAP32[r7>>2];r8=(r1|0)>>2;do{if((r11|0)<0){HEAP32[r8]=r11<<1;HEAP32[r4]=r10+1|0;r12=0}else{if(r11>>>0>201326591){r13=r11>>>28;r14=(HEAPU8[(r13<<1)+5252668|0]<<r6)+1|0;r15=HEAPU8[(r13<<1)+5252669|0];HEAP32[r4]=r10+(r6+(r15+1))|0;r13=r11<<r15;r15=r13>>31;r16=r13<<1;HEAP32[r8]=r16;if((r6|0)==0){r17=r14}else{r17=(r16>>>((32-r6|0)>>>0))+r14|0}HEAP32[r8]=r16<<r6;r12=(r17^r15)-r15|0;break}r15=r11>>>22;r16=(HEAPU8[(r15<<1)+5252684|0]<<r6)+1|0;r14=HEAPU8[(r15<<1)+5252685|0];r15=r10+(r14+1)|0;HEAP32[r4]=r15;r13=r11<<r14;r14=r13>>31;r18=r13<<1;HEAP32[r8]=r18;if((r6|0)==0){r19=r16}else{if((r15|0)>0){r13=r1+8|0;r20=HEAP32[r13>>2];r21=(HEAPU8[r20]<<8|HEAPU8[r20+1|0])<<r15|r18;HEAP32[r8]=r21;HEAP32[r13>>2]=r20+2|0;r20=r15-16|0;HEAP32[r4]=r20;r22=r21;r23=r20}else{r22=r18;r23=r15}HEAP32[r8]=r22<<r6;HEAP32[r4]=r23+r6|0;r19=(r22>>>((32-r6|0)>>>0))+r16|0}r12=(r19^r14)-r14|0}}while(0);r19=27-HEAP32[r7>>2]|0;r7=r12+r9<<r19>>r19;HEAP32[r5>>2]=r7;HEAP32[r2+40>>2]=r7;r5=HEAP32[r4];if((r5|0)>0){r19=r1+8|0;r9=HEAP32[r19>>2];r12=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r5|HEAP32[r8];HEAP32[r8]=r12;HEAP32[r19>>2]=r9+2|0;r9=r5-16|0;HEAP32[r4]=r9;r24=r9;r25=r12}else{r24=r5;r25=HEAP32[r8]}r5=r2+36|0;r12=HEAP32[r5>>2];r9=r2+52|0;r19=HEAP32[r9>>2];do{if((r25|0)<0){HEAP32[r8]=r25<<1;HEAP32[r4]=r24+1|0;r26=0}else{if(r25>>>0>201326591){r6=r25>>>28;r22=(HEAPU8[(r6<<1)+5252668|0]<<r19)+1|0;r23=HEAPU8[(r6<<1)+5252669|0];HEAP32[r4]=r24+(r19+(r23+1))|0;r6=r25<<r23;r23=r6>>31;r11=r6<<1;HEAP32[r8]=r11;if((r19|0)==0){r27=r22}else{r27=(r11>>>((32-r19|0)>>>0))+r22|0}HEAP32[r8]=r11<<r19;r26=(r27^r23)-r23|0;break}r23=r25>>>22;r11=(HEAPU8[(r23<<1)+5252684|0]<<r19)+1|0;r22=HEAPU8[(r23<<1)+5252685|0];r23=r24+(r22+1)|0;HEAP32[r4]=r23;r6=r25<<r22;r22=r6>>31;r10=r6<<1;HEAP32[r8]=r10;if((r19|0)==0){r28=r11}else{if((r23|0)>0){r6=r1+8|0;r17=HEAP32[r6>>2];r14=(HEAPU8[r17]<<8|HEAPU8[r17+1|0])<<r23|r10;HEAP32[r8]=r14;HEAP32[r6>>2]=r17+2|0;r17=r23-16|0;HEAP32[r4]=r17;r29=r14;r30=r17}else{r29=r10;r30=r23}HEAP32[r8]=r29<<r19;HEAP32[r4]=r30+r19|0;r28=(r29>>>((32-r19|0)>>>0))+r11|0}r26=(r28^r22)-r22|0}}while(0);r28=27-HEAP32[r9>>2]|0;r9=r26+r12<<r28>>r28;HEAP32[r5>>2]=r9;HEAP32[r2+44>>2]=r9;r5=(r1+24|0)>>2;r28=HEAP32[r5];r12=r28<<1;r26=r12+r7|0;r19=(HEAP32[r1+408>>2]<<1)+r9|0;r9=HEAP32[r1+48>>2];if(r26>>>0>r9>>>0){r29=(r26|0)<0?0:r9;r31=r29;r32=r29-r12|0}else{r31=r26;r32=r7}r7=HEAP32[r1+52>>2];if(r19>>>0<=r7>>>0){r33=r19;r34=r33<<1;r35=r34&2;r36=r31&1;r37=r35|r36;r38=r31>>>1;r39=r33>>>1;r40=r1+28|0;r41=HEAP32[r40>>2];r42=Math.imul(r39,r41);r43=r42+r38|0;r44=(r37<<2)+r3|0;r45=HEAP32[r44>>2];r46=r1+12|0;r47=HEAP32[r46>>2];r48=r47+r28|0;r49=r2|0;r50=HEAP32[r49>>2];r51=r50+r43|0;FUNCTION_TABLE[r45](r48,r51,r41,16);r52=r32>>>31;r53=r52&r32;r54=r43+r53|0;r55=r54>>>1;r56=(r32|0)/2&-1;r57=r56&1;r58=r35|r57;r59=r58|4;r60=(r59<<2)+r3|0,r61=r60>>2;r62=HEAP32[r61];r63=r1+16|0;r64=HEAP32[r63>>2];r65=r1+32|0,r66=r65>>2;r67=HEAP32[r66];r68=HEAP32[r5];r69=r68>>1;r70=r64+r69|0;r71=r2+4|0;r72=HEAP32[r71>>2];r73=r72+r55|0;FUNCTION_TABLE[r62](r70,r73,r67,16);r74=HEAP32[r61];r75=r1+20|0;r76=HEAP32[r75>>2];r77=HEAP32[r66];r78=HEAP32[r5];r79=r78>>1;r80=r76+r79|0;r81=r2+8|0;r82=HEAP32[r81>>2];r83=r82+r55|0;FUNCTION_TABLE[r74](r80,r83,r77,16);return}r33=(r19|0)<0?0:r7;r34=r33<<1;r35=r34&2;r36=r31&1;r37=r35|r36;r38=r31>>>1;r39=r33>>>1;r40=r1+28|0;r41=HEAP32[r40>>2];r42=Math.imul(r39,r41);r43=r42+r38|0;r44=(r37<<2)+r3|0;r45=HEAP32[r44>>2];r46=r1+12|0;r47=HEAP32[r46>>2];r48=r47+r28|0;r49=r2|0;r50=HEAP32[r49>>2];r51=r50+r43|0;FUNCTION_TABLE[r45](r48,r51,r41,16);r52=r32>>>31;r53=r52&r32;r54=r43+r53|0;r55=r54>>>1;r56=(r32|0)/2&-1;r57=r56&1;r58=r35|r57;r59=r58|4;r60=(r59<<2)+r3|0,r61=r60>>2;r62=HEAP32[r61];r63=r1+16|0;r64=HEAP32[r63>>2];r65=r1+32|0,r66=r65>>2;r67=HEAP32[r66];r68=HEAP32[r5];r69=r68>>1;r70=r64+r69|0;r71=r2+4|0;r72=HEAP32[r71>>2];r73=r72+r55|0;FUNCTION_TABLE[r62](r70,r73,r67,16);r74=HEAP32[r61];r75=r1+20|0;r76=HEAP32[r75>>2];r77=HEAP32[r66];r78=HEAP32[r5];r79=r78>>1;r80=r76+r79|0;r81=r2+8|0;r82=HEAP32[r81>>2];r83=r82+r55|0;FUNCTION_TABLE[r74](r80,r83,r77,16);return}function _motion_fr_dmv_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115;r3=(r1+4|0)>>2;r4=HEAP32[r3];if((r4|0)>0){r5=r1+8|0;r6=HEAP32[r5>>2];r7=r1|0;r8=(HEAPU8[r6]<<8|HEAPU8[r6+1|0])<<r4|HEAP32[r7>>2];HEAP32[r7>>2]=r8;HEAP32[r5>>2]=r6+2|0;r6=r4-16|0;HEAP32[r3]=r6;r9=r6;r10=r8}else{r9=r4;r10=HEAP32[r1>>2]}r4=r2+32|0;r8=HEAP32[r4>>2];r6=r2+48|0;r5=HEAP32[r6>>2];r7=(r1|0)>>2;do{if((r10|0)<0){HEAP32[r7]=r10<<1;HEAP32[r3]=r9+1|0;r11=0}else{if(r10>>>0>201326591){r12=r10>>>28;r13=(HEAPU8[(r12<<1)+5252668|0]<<r5)+1|0;r14=HEAPU8[(r12<<1)+5252669|0];HEAP32[r3]=r9+(r5+(r14+1))|0;r12=r10<<r14;r14=r12>>31;r15=r12<<1;HEAP32[r7]=r15;if((r5|0)==0){r16=r13}else{r16=(r15>>>((32-r5|0)>>>0))+r13|0}HEAP32[r7]=r15<<r5;r11=(r16^r14)-r14|0;break}r14=r10>>>22;r15=(HEAPU8[(r14<<1)+5252684|0]<<r5)+1|0;r13=HEAPU8[(r14<<1)+5252685|0];r14=r9+(r13+1)|0;HEAP32[r3]=r14;r12=r10<<r13;r13=r12>>31;r17=r12<<1;HEAP32[r7]=r17;if((r5|0)==0){r18=r15}else{if((r14|0)>0){r12=r1+8|0;r19=HEAP32[r12>>2];r20=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r14|r17;HEAP32[r7]=r20;HEAP32[r12>>2]=r19+2|0;r19=r14-16|0;HEAP32[r3]=r19;r21=r20;r22=r19}else{r21=r17;r22=r14}HEAP32[r7]=r21<<r5;HEAP32[r3]=r22+r5|0;r18=(r21>>>((32-r5|0)>>>0))+r15|0}r11=(r18^r13)-r13|0}}while(0);r18=27-HEAP32[r6>>2]|0;r6=r11+r8<<r18>>r18;HEAP32[r4>>2]=r6;HEAP32[r2+40>>2]=r6;r4=HEAP32[r3];if((r4|0)>0){r18=r1+8|0;r8=HEAP32[r18>>2];r11=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r4|HEAP32[r7];HEAP32[r7]=r11;HEAP32[r18>>2]=r8+2|0;r8=r4-16|0;HEAP32[r3]=r8;r23=r8;r24=r11}else{r23=r4;r24=HEAP32[r7]}r4=r24>>>30;r11=HEAPU8[(r4<<1)+5253245|0];r8=r24<<r11;HEAP32[r7]=r8;r24=r23+r11|0;HEAP32[r3]=r24;r11=HEAP8[(r4<<1)+5253244|0]<<24>>24;r4=r2+36|0;r23=HEAP32[r4>>2]>>1;r18=HEAP32[r2+52>>2];do{if((r8|0)<0){HEAP32[r7]=r8<<1;HEAP32[r3]=r24+1|0;r25=0}else{if(r8>>>0>201326591){r5=r8>>>28;r21=(HEAPU8[(r5<<1)+5252668|0]<<r18)+1|0;r22=HEAPU8[(r5<<1)+5252669|0];HEAP32[r3]=r22+(r24+(r18+1))|0;r5=r8<<r22;r22=r5>>31;r10=r5<<1;HEAP32[r7]=r10;if((r18|0)==0){r26=r21}else{r26=(r10>>>((32-r18|0)>>>0))+r21|0}HEAP32[r7]=r10<<r18;r25=(r26^r22)-r22|0;break}r22=r8>>>22;r10=(HEAPU8[(r22<<1)+5252684|0]<<r18)+1|0;r21=HEAPU8[(r22<<1)+5252685|0];r22=r21+(r24+1)|0;HEAP32[r3]=r22;r5=r8<<r21;r21=r5>>31;r9=r5<<1;HEAP32[r7]=r9;if((r18|0)==0){r27=r10}else{if((r22|0)>0){r5=r1+8|0;r16=HEAP32[r5>>2];r13=(HEAPU8[r16]<<8|HEAPU8[r16+1|0])<<r22|r9;HEAP32[r7]=r13;HEAP32[r5>>2]=r16+2|0;r16=r22-16|0;HEAP32[r3]=r16;r28=r13;r29=r16}else{r28=r9;r29=r22}HEAP32[r7]=r28<<r18;HEAP32[r3]=r29+r18|0;r27=(r28>>>((32-r18|0)>>>0))+r10|0}r25=(r27^r21)-r21|0}}while(0);r27=r25+r23|0;r23=r27<<1;HEAP32[r4>>2]=r23;HEAP32[r2+44>>2]=r23;r23=HEAP32[r7];r4=r23>>>30;r25=HEAPU8[(r4<<1)+5253245|0];HEAP32[r7]=r23<<r25;HEAP32[r3]=HEAP32[r3]+r25|0;r25=HEAP8[(r4<<1)+5253244|0]<<24>>24;r4=r1+16860|0;r3=(HEAP32[r4>>2]|0)!=0?1:3;r23=(r6|0)>0&1;r7=(Math.imul(r3,r6)+r23>>1)+r11|0;r18=(r27|0)>0&1;r28=Math.imul(r3,r27)+r18>>1;r3=(r1+24|0)>>2;r29=HEAP32[r3];r8=r29<<1;r24=r7+r8|0;r26=(r1+408|0)>>2;r21=r25-1+HEAP32[r26]+r28|0;r28=(r1+48|0)>>2;r10=HEAP32[r28];if(r24>>>0>r10>>>0){r22=(r24|0)<0?0:r10;r30=r22;r31=r22-r8|0}else{r30=r24;r31=r7}r7=(r1+60|0)>>2;r24=HEAP32[r7];if(r21>>>0>r24>>>0){r32=(r21|0)<0?0:r24}else{r32=r21}r21=r32<<1&2;r24=(r1+28|0)>>2;r8=HEAP32[r24];r22=Math.imul(r32|1,r8)+(r30>>>1)|0;r32=(r1+12|0)>>2;r10=(r2|0)>>2;FUNCTION_TABLE[HEAP32[((r21|r30&1)<<2)+5243300>>2]](HEAP32[r32]+r29|0,HEAP32[r10]+r22|0,r8<<1,8);r8=(r22+(r31>>>31&r31)|0)>>>1;r22=((r21|(r31|0)/2&-1&1|4)<<2)+5243300|0;r31=(r1+16|0)>>2;r21=(r1+32|0)>>2;r29=(r2+4|0)>>2;FUNCTION_TABLE[HEAP32[r22>>2]]((HEAP32[r3]>>1)+HEAP32[r31]|0,HEAP32[r29]+r8|0,HEAP32[r21]<<1,8);r30=(r1+20|0)>>2;r1=(r2+8|0)>>2;FUNCTION_TABLE[HEAP32[r22>>2]]((HEAP32[r3]>>1)+HEAP32[r30]|0,HEAP32[r1]+r8|0,HEAP32[r21]<<1,8);r8=(HEAP32[r4>>2]|0)!=0?3:1;r4=(Math.imul(r8,r6)+r23>>1)+r11|0;r11=Math.imul(r8,r27)+r18>>1;r18=HEAP32[r3];r8=r18<<1;r23=r4+r8|0;r22=r25+HEAP32[r26]+r11+1|0;r11=HEAP32[r28];if(r23>>>0>r11>>>0){r25=(r23|0)<0?0:r11;r33=r25;r34=r25-r8|0}else{r33=r23;r34=r4}r4=HEAP32[r7];if(r22>>>0>r4>>>0){r35=(r22|0)<0?0:r4}else{r35=r22}r22=r35<<1&2;r4=HEAP32[r24];r23=Math.imul(r35&-2,r4)+(r33>>>1)|0;FUNCTION_TABLE[HEAP32[((r22|r33&1)<<2)+5243300>>2]](HEAP32[r32]+r18+r4|0,HEAP32[r10]+r23|0,r4<<1,8);r4=(r23+(r34>>>31&r34)|0)>>>1;r23=((r22|(r34|0)/2&-1&1|4)<<2)+5243300|0;r34=HEAP32[r21];FUNCTION_TABLE[HEAP32[r23>>2]]((HEAP32[r3]>>1)+HEAP32[r31]+r34|0,HEAP32[r29]+r4|0,r34<<1,8);r34=HEAP32[r21];FUNCTION_TABLE[HEAP32[r23>>2]]((HEAP32[r3]>>1)+HEAP32[r30]+r34|0,HEAP32[r1]+r4|0,r34<<1,8);r34=HEAP32[r3];r4=r34<<1;r23=r4+r6|0;r22=HEAP32[r26]+r27|0;r27=HEAP32[r28];if(r23>>>0>r27>>>0){r28=(r23|0)<0?0:r27;r36=r28;r37=r28-r4|0}else{r36=r23;r37=r6}r6=HEAP32[r7];if(r22>>>0<=r6>>>0){r38=r22;r39=r38<<1;r40=r39&2;r41=r36&1;r42=r40|r41;r43=r36>>>1;r44=r38&-2;r45=HEAP32[r24];r46=Math.imul(r44,r45);r47=r46+r43|0;r48=(r42<<2)+5243332|0,r49=r48>>2;r50=HEAP32[r49];r51=HEAP32[r32];r52=r51+r34|0;r53=HEAP32[r10];r54=r53+r47|0;r55=r45<<1;FUNCTION_TABLE[r50](r52,r54,r55,8);r56=HEAP32[r49];r57=HEAP32[r32];r58=HEAP32[r24];r59=HEAP32[r3];r60=r59+r58|0;r61=r57+r60|0;r62=HEAP32[r10];r63=r58+r47|0;r64=r62+r63|0;r65=r58<<1;FUNCTION_TABLE[r56](r61,r64,r65,8);r66=r37>>>31;r67=r66&r37;r68=r47+r67|0;r69=r68>>>1;r70=(r37|0)/2&-1;r71=r70&1;r72=r40|r71;r73=r72|4;r74=(r73<<2)+5243332|0,r75=r74>>2;r76=HEAP32[r75];r77=HEAP32[r31];r78=HEAP32[r3];r79=r78>>1;r80=r77+r79|0;r81=HEAP32[r29];r82=r81+r69|0;r83=HEAP32[r21];r84=r83<<1;FUNCTION_TABLE[r76](r80,r82,r84,8);r85=HEAP32[r75];r86=HEAP32[r31];r87=HEAP32[r21];r88=HEAP32[r3];r89=r88>>1;r90=r89+r87|0;r91=r86+r90|0;r92=HEAP32[r29];r93=r87+r69|0;r94=r92+r93|0;r95=r87<<1;FUNCTION_TABLE[r85](r91,r94,r95,8);r96=HEAP32[r75];r97=HEAP32[r30];r98=HEAP32[r3];r99=r98>>1;r100=r97+r99|0;r101=HEAP32[r1];r102=r101+r69|0;r103=HEAP32[r21];r104=r103<<1;FUNCTION_TABLE[r96](r100,r102,r104,8);r105=HEAP32[r75];r106=HEAP32[r30];r107=HEAP32[r21];r108=HEAP32[r3];r109=r108>>1;r110=r109+r107|0;r111=r106+r110|0;r112=HEAP32[r1];r113=r107+r69|0;r114=r112+r113|0;r115=r107<<1;FUNCTION_TABLE[r105](r111,r114,r115,8);return}r38=(r22|0)<0?0:r6;r39=r38<<1;r40=r39&2;r41=r36&1;r42=r40|r41;r43=r36>>>1;r44=r38&-2;r45=HEAP32[r24];r46=Math.imul(r44,r45);r47=r46+r43|0;r48=(r42<<2)+5243332|0,r49=r48>>2;r50=HEAP32[r49];r51=HEAP32[r32];r52=r51+r34|0;r53=HEAP32[r10];r54=r53+r47|0;r55=r45<<1;FUNCTION_TABLE[r50](r52,r54,r55,8);r56=HEAP32[r49];r57=HEAP32[r32];r58=HEAP32[r24];r59=HEAP32[r3];r60=r59+r58|0;r61=r57+r60|0;r62=HEAP32[r10];r63=r58+r47|0;r64=r62+r63|0;r65=r58<<1;FUNCTION_TABLE[r56](r61,r64,r65,8);r66=r37>>>31;r67=r66&r37;r68=r47+r67|0;r69=r68>>>1;r70=(r37|0)/2&-1;r71=r70&1;r72=r40|r71;r73=r72|4;r74=(r73<<2)+5243332|0,r75=r74>>2;r76=HEAP32[r75];r77=HEAP32[r31];r78=HEAP32[r3];r79=r78>>1;r80=r77+r79|0;r81=HEAP32[r29];r82=r81+r69|0;r83=HEAP32[r21];r84=r83<<1;FUNCTION_TABLE[r76](r80,r82,r84,8);r85=HEAP32[r75];r86=HEAP32[r31];r87=HEAP32[r21];r88=HEAP32[r3];r89=r88>>1;r90=r89+r87|0;r91=r86+r90|0;r92=HEAP32[r29];r93=r87+r69|0;r94=r92+r93|0;r95=r87<<1;FUNCTION_TABLE[r85](r91,r94,r95,8);r96=HEAP32[r75];r97=HEAP32[r30];r98=HEAP32[r3];r99=r98>>1;r100=r97+r99|0;r101=HEAP32[r1];r102=r101+r69|0;r103=HEAP32[r21];r104=r103<<1;FUNCTION_TABLE[r96](r100,r102,r104,8);r105=HEAP32[r75];r106=HEAP32[r30];r107=HEAP32[r21];r108=HEAP32[r3];r109=r108>>1;r110=r109+r107|0;r111=r106+r110|0;r112=HEAP32[r1];r113=r107+r69|0;r114=r112+r113|0;r115=r107<<1;FUNCTION_TABLE[r105](r111,r114,r115,8);return}function _motion_reuse_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=r2>>2;r2=r1>>2;r5=HEAP32[r4+8];r6=(r1+24|0)>>2;r7=HEAP32[r6];r8=r7<<1;r9=r8+r5|0;r10=(HEAP32[r2+102]<<1)+HEAP32[r4+9]|0;r11=HEAP32[r2+12];if(r9>>>0>r11>>>0){r12=(r9|0)<0?0:r11;r13=r12-r8|0;r14=r12}else{r13=r5;r14=r9}r9=HEAP32[r2+13];if(r10>>>0>r9>>>0){r15=(r10|0)<0?0:r9}else{r15=r10}r10=r15<<1&2;r9=HEAP32[r2+7];r5=Math.imul(r15>>>1,r9)+(r14>>>1)|0;FUNCTION_TABLE[HEAP32[r3+((r10|r14&1)<<2)>>2]](HEAP32[r2+3]+r7|0,HEAP32[r4]+r5|0,r9,16);r9=(r5+(r13>>>31&r13)|0)>>>1;r5=((r10|(r13|0)/2&-1&1|4)<<2)+r3|0;r3=r1+32|0;FUNCTION_TABLE[HEAP32[r5>>2]]((HEAP32[r6]>>1)+HEAP32[r2+4]|0,HEAP32[r4+1]+r9|0,HEAP32[r3>>2],16);FUNCTION_TABLE[HEAP32[r5>>2]]((HEAP32[r6]>>1)+HEAP32[r2+5]|0,HEAP32[r4+2]+r9|0,HEAP32[r3>>2],16);return}function _motion_zero_444(r1,r2,r3){var r4,r5,r6,r7,r8;r4=(r1+24|0)>>2;r5=(r2+32|0)>>2;HEAP32[r5]=0;HEAP32[r5+1]=0;HEAP32[r5+2]=0;HEAP32[r5+3]=0;r5=HEAP32[r4];r6=(r1+28|0)>>2;r7=HEAP32[r6];r8=Math.imul(r7,HEAP32[r1+408>>2])+r5|0;FUNCTION_TABLE[HEAP32[r3>>2]](HEAP32[r1+12>>2]+r5|0,HEAP32[r2>>2]+r8|0,r7,16);r7=r3+16|0;FUNCTION_TABLE[HEAP32[r7>>2]](HEAP32[r1+16>>2]+HEAP32[r4]|0,HEAP32[r2+4>>2]+r8|0,HEAP32[r6],16);FUNCTION_TABLE[HEAP32[r7>>2]](HEAP32[r1+20>>2]+HEAP32[r4]|0,HEAP32[r2+8>>2]+r8|0,HEAP32[r6],16);return}function _motion_fr_field_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=r11>>>31;r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=(r2+48|0)>>2;r13=HEAP32[r12];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12]|0;r13=r14+r8<<r21>>r21;HEAP32[r6>>2]=r13;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2]>>1;r8=r2+52|0;r21=HEAP32[r8>>2];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r24=r27>>>28;r25=(HEAPU8[(r24<<1)+5252668|0]<<r21)+1|0;r7=HEAPU8[(r24<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r7+1))|0;r24=r27<<r7;r7=r24>>31;r10=r24<<1;HEAP32[r5]=r10;if((r21|0)==0){r29=r25}else{r29=(r10>>>((32-r21|0)>>>0))+r25|0}HEAP32[r5]=r10<<r21;r28=(r29^r7)-r7|0;break}r7=r27>>>22;r10=(HEAPU8[(r7<<1)+5252684|0]<<r21)+1|0;r25=HEAPU8[(r7<<1)+5252685|0];r7=r26+(r25+1)|0;HEAP32[r4]=r7;r24=r27<<r25;r25=r24>>31;r11=r24<<1;HEAP32[r5]=r11;if((r21|0)==0){r30=r10}else{if((r7|0)>0){r24=r1+8|0;r19=HEAP32[r24>>2];r16=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r7|r11;HEAP32[r5]=r16;HEAP32[r24>>2]=r19+2|0;r19=r7-16|0;HEAP32[r4]=r19;r31=r16;r32=r19}else{r31=r11;r32=r7}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r10|0}r28=(r30^r25)-r25|0}}while(0);r30=r28+r14|0;HEAP32[r6>>2]=r30<<1;r6=(r1+24|0)>>2;r14=HEAP32[r6];r28=(r14<<1)+r13|0;r13=r1+408|0;r21=HEAP32[r13>>2]+r30|0;r30=r1+48|0;r31=HEAP32[r30>>2];if(r28>>>0>r31>>>0){r33=(r28|0)<0?0:r31}else{r33=r28}r28=r1+60|0;r31=HEAP32[r28>>2];if(r21>>>0>r31>>>0){r34=(r21|0)<0?0:r31}else{r34=r21}r21=(r1+28|0)>>2;r31=HEAP32[r21];r32=Math.imul(r34&-2|r9,r31)+(r33>>>1)|0;r9=(((r34<<1&2|r33&1)<<2)+r3|0)>>2;r33=(r1+12|0)>>2;r34=(r2|0)>>2;FUNCTION_TABLE[HEAP32[r9]](HEAP32[r33]+r14|0,HEAP32[r34]+r32|0,r31<<1,8);r31=(r1+16|0)>>2;r14=(r2+4|0)>>2;FUNCTION_TABLE[HEAP32[r9]](HEAP32[r31]+HEAP32[r6]|0,HEAP32[r14]+r32|0,HEAP32[r21]<<1,8);r27=(r1+20|0)>>2;r26=(r2+8|0)>>2;FUNCTION_TABLE[HEAP32[r9]](HEAP32[r27]+HEAP32[r6]|0,HEAP32[r26]+r32|0,HEAP32[r21]<<1,8);r32=HEAP32[r4];if((r32|0)>0){r9=r1+8|0;r29=HEAP32[r9>>2];r25=(HEAPU8[r29]<<8|HEAPU8[r29+1|0])<<r32|HEAP32[r5];HEAP32[r5]=r25;HEAP32[r9>>2]=r29+2|0;r29=r32-16|0;HEAP32[r4]=r29;r35=r29;r36=r25}else{r35=r32;r36=HEAP32[r5]}r32=r36>>>31;r25=r36<<1;HEAP32[r5]=r25;HEAP32[r4]=r35+1|0;r29=r2+40|0;r9=HEAP32[r29>>2];r10=HEAP32[r12];do{if((r25|0)<0){HEAP32[r5]=r36<<2;HEAP32[r4]=r35+2|0;r37=0}else{if(r25>>>0>201326591){r7=r36>>>27&15;r11=(HEAPU8[(r7<<1)+5252668|0]<<r10)+1|0;r19=HEAPU8[(r7<<1)+5252669|0];HEAP32[r4]=r19+(r35+(r10+2))|0;r7=r25<<r19;r19=r7>>31;r16=r7<<1;HEAP32[r5]=r16;if((r10|0)==0){r38=r11}else{r38=(r16>>>((32-r10|0)>>>0))+r11|0}HEAP32[r5]=r16<<r10;r37=(r38^r19)-r19|0;break}r19=r36>>>21&1023;r16=(HEAPU8[(r19<<1)+5252684|0]<<r10)+1|0;r11=HEAPU8[(r19<<1)+5252685|0];r19=r11+(r35+2)|0;HEAP32[r4]=r19;r7=r25<<r11;r11=r7>>31;r24=r7<<1;HEAP32[r5]=r24;if((r10|0)==0){r39=r16}else{if((r19|0)>0){r7=r1+8|0;r18=HEAP32[r7>>2];r17=(HEAPU8[r18]<<8|HEAPU8[r18+1|0])<<r19|r24;HEAP32[r5]=r17;HEAP32[r7>>2]=r18+2|0;r18=r19-16|0;HEAP32[r4]=r18;r40=r17;r41=r18}else{r40=r24;r41=r19}HEAP32[r5]=r40<<r10;HEAP32[r4]=r41+r10|0;r39=(r40>>>((32-r10|0)>>>0))+r16|0}r37=(r39^r11)-r11|0}}while(0);r39=27-HEAP32[r12]|0;r12=r37+r9<<r39>>r39;HEAP32[r29>>2]=r12;r29=HEAP32[r4];if((r29|0)>0){r39=r1+8|0;r9=HEAP32[r39>>2];r37=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r29|HEAP32[r5];HEAP32[r5]=r37;HEAP32[r39>>2]=r9+2|0;r9=r29-16|0;HEAP32[r4]=r9;r42=r9;r43=r37}else{r42=r29;r43=HEAP32[r5]}r29=r2+44|0;r2=HEAP32[r29>>2]>>1;r37=HEAP32[r8>>2];do{if((r43|0)<0){HEAP32[r5]=r43<<1;HEAP32[r4]=r42+1|0;r44=0}else{if(r43>>>0>201326591){r8=r43>>>28;r9=(HEAPU8[(r8<<1)+5252668|0]<<r37)+1|0;r39=HEAPU8[(r8<<1)+5252669|0];HEAP32[r4]=r42+(r37+(r39+1))|0;r8=r43<<r39;r39=r8>>31;r10=r8<<1;HEAP32[r5]=r10;if((r37|0)==0){r45=r9}else{r45=(r10>>>((32-r37|0)>>>0))+r9|0}HEAP32[r5]=r10<<r37;r44=(r45^r39)-r39|0;break}r39=r43>>>22;r10=(HEAPU8[(r39<<1)+5252684|0]<<r37)+1|0;r9=HEAPU8[(r39<<1)+5252685|0];r39=r42+(r9+1)|0;HEAP32[r4]=r39;r8=r43<<r9;r9=r8>>31;r40=r8<<1;HEAP32[r5]=r40;if((r37|0)==0){r46=r10}else{if((r39|0)>0){r8=r1+8|0;r41=HEAP32[r8>>2];r25=(HEAPU8[r41]<<8|HEAPU8[r41+1|0])<<r39|r40;HEAP32[r5]=r25;HEAP32[r8>>2]=r41+2|0;r41=r39-16|0;HEAP32[r4]=r41;r47=r25;r48=r41}else{r47=r40;r48=r39}HEAP32[r5]=r47<<r37;HEAP32[r4]=r48+r37|0;r46=(r47>>>((32-r37|0)>>>0))+r10|0}r44=(r46^r9)-r9|0}}while(0);r46=r44+r2|0;HEAP32[r29>>2]=r46<<1;r29=HEAP32[r6];r2=(r29<<1)+r12|0;r12=HEAP32[r13>>2]+r46|0;r46=HEAP32[r30>>2];if(r2>>>0>r46>>>0){r49=(r2|0)<0?0:r46}else{r49=r2}r2=HEAP32[r28>>2];if(r12>>>0<=r2>>>0){r50=r12;r51=r50<<1;r52=r51&2;r53=r49&1;r54=r52|r53;r55=r49>>>1;r56=r50&-2;r57=r56|r32;r58=HEAP32[r21];r59=Math.imul(r57,r58);r60=r59+r55|0;r61=(r54<<2)+r3|0,r62=r61>>2;r63=HEAP32[r62];r64=HEAP32[r33];r65=r29+r58|0;r66=r64+r65|0;r67=HEAP32[r34];r68=r67+r60|0;r69=r58<<1;FUNCTION_TABLE[r63](r66,r68,r69,8);r70=HEAP32[r62];r71=HEAP32[r31];r72=HEAP32[r21];r73=HEAP32[r6];r74=r73+r72|0;r75=r71+r74|0;r76=HEAP32[r14];r77=r76+r60|0;r78=r72<<1;FUNCTION_TABLE[r70](r75,r77,r78,8);r79=HEAP32[r62];r80=HEAP32[r27];r81=HEAP32[r21];r82=HEAP32[r6];r83=r82+r81|0;r84=r80+r83|0;r85=HEAP32[r26];r86=r85+r60|0;r87=r81<<1;FUNCTION_TABLE[r79](r84,r86,r87,8);return}r50=(r12|0)<0?0:r2;r51=r50<<1;r52=r51&2;r53=r49&1;r54=r52|r53;r55=r49>>>1;r56=r50&-2;r57=r56|r32;r58=HEAP32[r21];r59=Math.imul(r57,r58);r60=r59+r55|0;r61=(r54<<2)+r3|0,r62=r61>>2;r63=HEAP32[r62];r64=HEAP32[r33];r65=r29+r58|0;r66=r64+r65|0;r67=HEAP32[r34];r68=r67+r60|0;r69=r58<<1;FUNCTION_TABLE[r63](r66,r68,r69,8);r70=HEAP32[r62];r71=HEAP32[r31];r72=HEAP32[r21];r73=HEAP32[r6];r74=r73+r72|0;r75=r71+r74|0;r76=HEAP32[r14];r77=r76+r60|0;r78=r72<<1;FUNCTION_TABLE[r70](r75,r77,r78,8);r79=HEAP32[r62];r80=HEAP32[r27];r81=HEAP32[r21];r82=HEAP32[r6];r83=r82+r81|0;r84=r80+r83|0;r85=HEAP32[r26];r86=r85+r60|0;r87=r81<<1;FUNCTION_TABLE[r79](r84,r86,r87,8);return}function _motion_fr_frame_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=r2+32|0;r9=HEAP32[r5>>2];r7=r2+48|0;r6=HEAP32[r7>>2];r8=(r1|0)>>2;do{if((r11|0)<0){HEAP32[r8]=r11<<1;HEAP32[r4]=r10+1|0;r12=0}else{if(r11>>>0>201326591){r13=r11>>>28;r14=(HEAPU8[(r13<<1)+5252668|0]<<r6)+1|0;r15=HEAPU8[(r13<<1)+5252669|0];HEAP32[r4]=r10+(r6+(r15+1))|0;r13=r11<<r15;r15=r13>>31;r16=r13<<1;HEAP32[r8]=r16;if((r6|0)==0){r17=r14}else{r17=(r16>>>((32-r6|0)>>>0))+r14|0}HEAP32[r8]=r16<<r6;r12=(r17^r15)-r15|0;break}r15=r11>>>22;r16=(HEAPU8[(r15<<1)+5252684|0]<<r6)+1|0;r14=HEAPU8[(r15<<1)+5252685|0];r15=r10+(r14+1)|0;HEAP32[r4]=r15;r13=r11<<r14;r14=r13>>31;r18=r13<<1;HEAP32[r8]=r18;if((r6|0)==0){r19=r16}else{if((r15|0)>0){r13=r1+8|0;r20=HEAP32[r13>>2];r21=(HEAPU8[r20]<<8|HEAPU8[r20+1|0])<<r15|r18;HEAP32[r8]=r21;HEAP32[r13>>2]=r20+2|0;r20=r15-16|0;HEAP32[r4]=r20;r22=r21;r23=r20}else{r22=r18;r23=r15}HEAP32[r8]=r22<<r6;HEAP32[r4]=r23+r6|0;r19=(r22>>>((32-r6|0)>>>0))+r16|0}r12=(r19^r14)-r14|0}}while(0);r19=27-HEAP32[r7>>2]|0;r7=r12+r9<<r19>>r19;HEAP32[r5>>2]=r7;HEAP32[r2+40>>2]=r7;r5=HEAP32[r4];if((r5|0)>0){r19=r1+8|0;r9=HEAP32[r19>>2];r12=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r5|HEAP32[r8];HEAP32[r8]=r12;HEAP32[r19>>2]=r9+2|0;r9=r5-16|0;HEAP32[r4]=r9;r24=r9;r25=r12}else{r24=r5;r25=HEAP32[r8]}r5=r2+36|0;r12=HEAP32[r5>>2];r9=r2+52|0;r19=HEAP32[r9>>2];do{if((r25|0)<0){HEAP32[r8]=r25<<1;HEAP32[r4]=r24+1|0;r26=0}else{if(r25>>>0>201326591){r6=r25>>>28;r22=(HEAPU8[(r6<<1)+5252668|0]<<r19)+1|0;r23=HEAPU8[(r6<<1)+5252669|0];HEAP32[r4]=r24+(r19+(r23+1))|0;r6=r25<<r23;r23=r6>>31;r11=r6<<1;HEAP32[r8]=r11;if((r19|0)==0){r27=r22}else{r27=(r11>>>((32-r19|0)>>>0))+r22|0}HEAP32[r8]=r11<<r19;r26=(r27^r23)-r23|0;break}r23=r25>>>22;r11=(HEAPU8[(r23<<1)+5252684|0]<<r19)+1|0;r22=HEAPU8[(r23<<1)+5252685|0];r23=r24+(r22+1)|0;HEAP32[r4]=r23;r6=r25<<r22;r22=r6>>31;r10=r6<<1;HEAP32[r8]=r10;if((r19|0)==0){r28=r11}else{if((r23|0)>0){r6=r1+8|0;r17=HEAP32[r6>>2];r14=(HEAPU8[r17]<<8|HEAPU8[r17+1|0])<<r23|r10;HEAP32[r8]=r14;HEAP32[r6>>2]=r17+2|0;r17=r23-16|0;HEAP32[r4]=r17;r29=r14;r30=r17}else{r29=r10;r30=r23}HEAP32[r8]=r29<<r19;HEAP32[r4]=r30+r19|0;r28=(r29>>>((32-r19|0)>>>0))+r11|0}r26=(r28^r22)-r22|0}}while(0);r28=27-HEAP32[r9>>2]|0;r9=r26+r12<<r28>>r28;HEAP32[r5>>2]=r9;HEAP32[r2+44>>2]=r9;r5=(r1+24|0)>>2;r28=HEAP32[r5];r12=(r28<<1)+r7|0;r7=(HEAP32[r1+408>>2]<<1)+r9|0;r9=HEAP32[r1+48>>2];if(r12>>>0>r9>>>0){r31=(r12|0)<0?0:r9}else{r31=r12}r12=HEAP32[r1+52>>2];if(r7>>>0<=r12>>>0){r32=r7;r33=r32<<1;r34=r33&2;r35=r31&1;r36=r34|r35;r37=r31>>>1;r38=r32>>>1;r39=r1+28|0,r40=r39>>2;r41=HEAP32[r40];r42=Math.imul(r38,r41);r43=r42+r37|0;r44=(r36<<2)+r3|0,r45=r44>>2;r46=HEAP32[r45];r47=r1+12|0;r48=HEAP32[r47>>2];r49=r48+r28|0;r50=r2|0;r51=HEAP32[r50>>2];r52=r51+r43|0;FUNCTION_TABLE[r46](r49,r52,r41,16);r53=HEAP32[r45];r54=r1+16|0;r55=HEAP32[r54>>2];r56=HEAP32[r40];r57=HEAP32[r5];r58=r55+r57|0;r59=r2+4|0;r60=HEAP32[r59>>2];r61=r60+r43|0;FUNCTION_TABLE[r53](r58,r61,r56,16);r62=HEAP32[r45];r63=r1+20|0;r64=HEAP32[r63>>2];r65=HEAP32[r40];r66=HEAP32[r5];r67=r64+r66|0;r68=r2+8|0;r69=HEAP32[r68>>2];r70=r69+r43|0;FUNCTION_TABLE[r62](r67,r70,r65,16);return}r32=(r7|0)<0?0:r12;r33=r32<<1;r34=r33&2;r35=r31&1;r36=r34|r35;r37=r31>>>1;r38=r32>>>1;r39=r1+28|0,r40=r39>>2;r41=HEAP32[r40];r42=Math.imul(r38,r41);r43=r42+r37|0;r44=(r36<<2)+r3|0,r45=r44>>2;r46=HEAP32[r45];r47=r1+12|0;r48=HEAP32[r47>>2];r49=r48+r28|0;r50=r2|0;r51=HEAP32[r50>>2];r52=r51+r43|0;FUNCTION_TABLE[r46](r49,r52,r41,16);r53=HEAP32[r45];r54=r1+16|0;r55=HEAP32[r54>>2];r56=HEAP32[r40];r57=HEAP32[r5];r58=r55+r57|0;r59=r2+4|0;r60=HEAP32[r59>>2];r61=r60+r43|0;FUNCTION_TABLE[r53](r58,r61,r56,16);r62=HEAP32[r45];r63=r1+20|0;r64=HEAP32[r63>>2];r65=HEAP32[r40];r66=HEAP32[r5];r67=r64+r66|0;r68=r2+8|0;r69=HEAP32[r68>>2];r70=r69+r43|0;FUNCTION_TABLE[r62](r67,r70,r65,16);return}function _motion_fr_dmv_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98;r3=(r1+4|0)>>2;r4=HEAP32[r3];if((r4|0)>0){r5=r1+8|0;r6=HEAP32[r5>>2];r7=r1|0;r8=(HEAPU8[r6]<<8|HEAPU8[r6+1|0])<<r4|HEAP32[r7>>2];HEAP32[r7>>2]=r8;HEAP32[r5>>2]=r6+2|0;r6=r4-16|0;HEAP32[r3]=r6;r9=r6;r10=r8}else{r9=r4;r10=HEAP32[r1>>2]}r4=r2+32|0;r8=HEAP32[r4>>2];r6=r2+48|0;r5=HEAP32[r6>>2];r7=(r1|0)>>2;do{if((r10|0)<0){HEAP32[r7]=r10<<1;HEAP32[r3]=r9+1|0;r11=0}else{if(r10>>>0>201326591){r12=r10>>>28;r13=(HEAPU8[(r12<<1)+5252668|0]<<r5)+1|0;r14=HEAPU8[(r12<<1)+5252669|0];HEAP32[r3]=r9+(r5+(r14+1))|0;r12=r10<<r14;r14=r12>>31;r15=r12<<1;HEAP32[r7]=r15;if((r5|0)==0){r16=r13}else{r16=(r15>>>((32-r5|0)>>>0))+r13|0}HEAP32[r7]=r15<<r5;r11=(r16^r14)-r14|0;break}r14=r10>>>22;r15=(HEAPU8[(r14<<1)+5252684|0]<<r5)+1|0;r13=HEAPU8[(r14<<1)+5252685|0];r14=r9+(r13+1)|0;HEAP32[r3]=r14;r12=r10<<r13;r13=r12>>31;r17=r12<<1;HEAP32[r7]=r17;if((r5|0)==0){r18=r15}else{if((r14|0)>0){r12=r1+8|0;r19=HEAP32[r12>>2];r20=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r14|r17;HEAP32[r7]=r20;HEAP32[r12>>2]=r19+2|0;r19=r14-16|0;HEAP32[r3]=r19;r21=r20;r22=r19}else{r21=r17;r22=r14}HEAP32[r7]=r21<<r5;HEAP32[r3]=r22+r5|0;r18=(r21>>>((32-r5|0)>>>0))+r15|0}r11=(r18^r13)-r13|0}}while(0);r18=27-HEAP32[r6>>2]|0;r6=r11+r8<<r18>>r18;HEAP32[r4>>2]=r6;HEAP32[r2+40>>2]=r6;r4=HEAP32[r3];if((r4|0)>0){r18=r1+8|0;r8=HEAP32[r18>>2];r11=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r4|HEAP32[r7];HEAP32[r7]=r11;HEAP32[r18>>2]=r8+2|0;r8=r4-16|0;HEAP32[r3]=r8;r23=r8;r24=r11}else{r23=r4;r24=HEAP32[r7]}r4=r24>>>30;r11=HEAPU8[(r4<<1)+5253245|0];r8=r24<<r11;HEAP32[r7]=r8;r24=r23+r11|0;HEAP32[r3]=r24;r11=HEAP8[(r4<<1)+5253244|0]<<24>>24;r4=r2+36|0;r23=HEAP32[r4>>2]>>1;r18=HEAP32[r2+52>>2];do{if((r8|0)<0){HEAP32[r7]=r8<<1;HEAP32[r3]=r24+1|0;r25=0}else{if(r8>>>0>201326591){r5=r8>>>28;r21=(HEAPU8[(r5<<1)+5252668|0]<<r18)+1|0;r22=HEAPU8[(r5<<1)+5252669|0];HEAP32[r3]=r22+(r24+(r18+1))|0;r5=r8<<r22;r22=r5>>31;r10=r5<<1;HEAP32[r7]=r10;if((r18|0)==0){r26=r21}else{r26=(r10>>>((32-r18|0)>>>0))+r21|0}HEAP32[r7]=r10<<r18;r25=(r26^r22)-r22|0;break}r22=r8>>>22;r10=(HEAPU8[(r22<<1)+5252684|0]<<r18)+1|0;r21=HEAPU8[(r22<<1)+5252685|0];r22=r21+(r24+1)|0;HEAP32[r3]=r22;r5=r8<<r21;r21=r5>>31;r9=r5<<1;HEAP32[r7]=r9;if((r18|0)==0){r27=r10}else{if((r22|0)>0){r5=r1+8|0;r16=HEAP32[r5>>2];r13=(HEAPU8[r16]<<8|HEAPU8[r16+1|0])<<r22|r9;HEAP32[r7]=r13;HEAP32[r5>>2]=r16+2|0;r16=r22-16|0;HEAP32[r3]=r16;r28=r13;r29=r16}else{r28=r9;r29=r22}HEAP32[r7]=r28<<r18;HEAP32[r3]=r29+r18|0;r27=(r28>>>((32-r18|0)>>>0))+r10|0}r25=(r27^r21)-r21|0}}while(0);r27=r25+r23|0;r23=r27<<1;HEAP32[r4>>2]=r23;HEAP32[r2+44>>2]=r23;r23=HEAP32[r7];r4=r23>>>30;r25=HEAPU8[(r4<<1)+5253245|0];HEAP32[r7]=r23<<r25;HEAP32[r3]=HEAP32[r3]+r25|0;r25=HEAP8[(r4<<1)+5253244|0]<<24>>24;r4=r1+16860|0;r3=(HEAP32[r4>>2]|0)!=0?1:3;r23=(r6|0)>0&1;r7=Math.imul(r3,r6)+r23>>1;r18=(r27|0)>0&1;r28=Math.imul(r3,r27)+r18>>1;r3=(r1+24|0)>>2;r29=HEAP32[r3];r8=(r29<<1)+r11+r7|0;r7=(r1+408|0)>>2;r24=r25-1+HEAP32[r7]+r28|0;r28=(r1+48|0)>>2;r26=HEAP32[r28];if(r8>>>0>r26>>>0){r30=(r8|0)<0?0:r26}else{r30=r8}r8=(r1+60|0)>>2;r26=HEAP32[r8];if(r24>>>0>r26>>>0){r31=(r24|0)<0?0:r26}else{r31=r24}r24=(r1+28|0)>>2;r26=HEAP32[r24];r21=Math.imul(r31|1,r26)+(r30>>>1)|0;r10=(((r31<<1&2|r30&1)<<2)+5243300|0)>>2;r30=(r1+12|0)>>2;r31=(r2|0)>>2;FUNCTION_TABLE[HEAP32[r10]](HEAP32[r30]+r29|0,HEAP32[r31]+r21|0,r26<<1,8);r26=(r1+16|0)>>2;r29=(r2+4|0)>>2;FUNCTION_TABLE[HEAP32[r10]](HEAP32[r26]+HEAP32[r3]|0,HEAP32[r29]+r21|0,HEAP32[r24]<<1,8);r22=(r1+20|0)>>2;r1=(r2+8|0)>>2;FUNCTION_TABLE[HEAP32[r10]](HEAP32[r22]+HEAP32[r3]|0,HEAP32[r1]+r21|0,HEAP32[r24]<<1,8);r21=(HEAP32[r4>>2]|0)!=0?3:1;r4=Math.imul(r21,r6)+r23>>1;r23=Math.imul(r21,r27)+r18>>1;r18=HEAP32[r3];r21=(r18<<1)+r11+r4|0;r4=r25+HEAP32[r7]+r23+1|0;r23=HEAP32[r28];if(r21>>>0>r23>>>0){r32=(r21|0)<0?0:r23}else{r32=r21}r21=HEAP32[r8];if(r4>>>0>r21>>>0){r33=(r4|0)<0?0:r21}else{r33=r4}r4=HEAP32[r24];r21=Math.imul(r33&-2,r4)+(r32>>>1)|0;r23=(((r33<<1&2|r32&1)<<2)+5243300|0)>>2;FUNCTION_TABLE[HEAP32[r23]](HEAP32[r30]+r18+r4|0,HEAP32[r31]+r21|0,r4<<1,8);r4=HEAP32[r24];FUNCTION_TABLE[HEAP32[r23]](HEAP32[r26]+HEAP32[r3]+r4|0,HEAP32[r29]+r21|0,r4<<1,8);r4=HEAP32[r24];FUNCTION_TABLE[HEAP32[r23]](HEAP32[r22]+HEAP32[r3]+r4|0,HEAP32[r1]+r21|0,r4<<1,8);r4=HEAP32[r3];r21=(r4<<1)+r6|0;r6=HEAP32[r7]+r27|0;r27=HEAP32[r28];if(r21>>>0>r27>>>0){r34=(r21|0)<0?0:r27}else{r34=r21}r21=HEAP32[r8];if(r6>>>0<=r21>>>0){r35=r6;r36=r35<<1;r37=r36&2;r38=r34&1;r39=r37|r38;r40=r34>>>1;r41=r35&-2;r42=HEAP32[r24];r43=Math.imul(r41,r42);r44=r43+r40|0;r45=(r39<<2)+5243332|0,r46=r45>>2;r47=HEAP32[r46];r48=HEAP32[r30];r49=r48+r4|0;r50=HEAP32[r31];r51=r50+r44|0;r52=r42<<1;FUNCTION_TABLE[r47](r49,r51,r52,8);r53=HEAP32[r46];r54=HEAP32[r30];r55=HEAP32[r24];r56=HEAP32[r3];r57=r56+r55|0;r58=r54+r57|0;r59=HEAP32[r31];r60=r55+r44|0;r61=r59+r60|0;r62=r55<<1;FUNCTION_TABLE[r53](r58,r61,r62,8);r63=HEAP32[r46];r64=HEAP32[r26];r65=HEAP32[r3];r66=r64+r65|0;r67=HEAP32[r29];r68=r67+r44|0;r69=HEAP32[r24];r70=r69<<1;FUNCTION_TABLE[r63](r66,r68,r70,8);r71=HEAP32[r46];r72=HEAP32[r26];r73=HEAP32[r24];r74=HEAP32[r3];r75=r74+r73|0;r76=r72+r75|0;r77=HEAP32[r29];r78=r73+r44|0;r79=r77+r78|0;r80=r73<<1;FUNCTION_TABLE[r71](r76,r79,r80,8);r81=HEAP32[r46];r82=HEAP32[r22];r83=HEAP32[r3];r84=r82+r83|0;r85=HEAP32[r1];r86=r85+r44|0;r87=HEAP32[r24];r88=r87<<1;FUNCTION_TABLE[r81](r84,r86,r88,8);r89=HEAP32[r46];r90=HEAP32[r22];r91=HEAP32[r24];r92=HEAP32[r3];r93=r92+r91|0;r94=r90+r93|0;r95=HEAP32[r1];r96=r91+r44|0;r97=r95+r96|0;r98=r91<<1;FUNCTION_TABLE[r89](r94,r97,r98,8);return}r35=(r6|0)<0?0:r21;r36=r35<<1;r37=r36&2;r38=r34&1;r39=r37|r38;r40=r34>>>1;r41=r35&-2;r42=HEAP32[r24];r43=Math.imul(r41,r42);r44=r43+r40|0;r45=(r39<<2)+5243332|0,r46=r45>>2;r47=HEAP32[r46];r48=HEAP32[r30];r49=r48+r4|0;r50=HEAP32[r31];r51=r50+r44|0;r52=r42<<1;FUNCTION_TABLE[r47](r49,r51,r52,8);r53=HEAP32[r46];r54=HEAP32[r30];r55=HEAP32[r24];r56=HEAP32[r3];r57=r56+r55|0;r58=r54+r57|0;r59=HEAP32[r31];r60=r55+r44|0;r61=r59+r60|0;r62=r55<<1;FUNCTION_TABLE[r53](r58,r61,r62,8);r63=HEAP32[r46];r64=HEAP32[r26];r65=HEAP32[r3];r66=r64+r65|0;r67=HEAP32[r29];r68=r67+r44|0;r69=HEAP32[r24];r70=r69<<1;FUNCTION_TABLE[r63](r66,r68,r70,8);r71=HEAP32[r46];r72=HEAP32[r26];r73=HEAP32[r24];r74=HEAP32[r3];r75=r74+r73|0;r76=r72+r75|0;r77=HEAP32[r29];r78=r73+r44|0;r79=r77+r78|0;r80=r73<<1;FUNCTION_TABLE[r71](r76,r79,r80,8);r81=HEAP32[r46];r82=HEAP32[r22];r83=HEAP32[r3];r84=r82+r83|0;r85=HEAP32[r1];r86=r85+r44|0;r87=HEAP32[r24];r88=r87<<1;FUNCTION_TABLE[r81](r84,r86,r88,8);r89=HEAP32[r46];r90=HEAP32[r22];r91=HEAP32[r24];r92=HEAP32[r3];r93=r92+r91|0;r94=r90+r93|0;r95=HEAP32[r1];r96=r91+r44|0;r97=r95+r96|0;r98=r91<<1;FUNCTION_TABLE[r89](r94,r97,r98,8);return}function _motion_reuse_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=r2>>2;r2=r1>>2;r5=(r1+24|0)>>2;r6=HEAP32[r5];r7=(r6<<1)+HEAP32[r4+8]|0;r8=(HEAP32[r2+102]<<1)+HEAP32[r4+9]|0;r9=HEAP32[r2+12];if(r7>>>0>r9>>>0){r10=(r7|0)<0?0:r9}else{r10=r7}r7=HEAP32[r2+13];if(r8>>>0>r7>>>0){r11=(r8|0)<0?0:r7}else{r11=r8}r8=(r1+28|0)>>2;r1=HEAP32[r8];r7=Math.imul(r11>>>1,r1)+(r10>>>1)|0;r9=(((r11<<1&2|r10&1)<<2)+r3|0)>>2;FUNCTION_TABLE[HEAP32[r9]](HEAP32[r2+3]+r6|0,HEAP32[r4]+r7|0,r1,16);FUNCTION_TABLE[HEAP32[r9]](HEAP32[r2+4]+HEAP32[r5]|0,HEAP32[r4+1]+r7|0,HEAP32[r8],16);FUNCTION_TABLE[HEAP32[r9]](HEAP32[r2+5]+HEAP32[r5]|0,HEAP32[r4+2]+r7|0,HEAP32[r8],16);return}function _motion_fi_field_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=HEAP32[r2+(r11>>>31<<2)+24>>2];r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=r2+48|0;r13=HEAP32[r12>>2];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12>>2]|0;r12=r14+r8<<r21>>r21;HEAP32[r6>>2]=r12;HEAP32[r2+40>>2]=r12;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2];r8=r2+52|0;r21=HEAP32[r8>>2];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r13=r27>>>28;r24=(HEAPU8[(r13<<1)+5252668|0]<<r21)+1|0;r25=HEAPU8[(r13<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r25+1))|0;r13=r27<<r25;r25=r13>>31;r7=r13<<1;HEAP32[r5]=r7;if((r21|0)==0){r29=r24}else{r29=(r7>>>((32-r21|0)>>>0))+r24|0}HEAP32[r5]=r7<<r21;r28=(r29^r25)-r25|0;break}r25=r27>>>22;r7=(HEAPU8[(r25<<1)+5252684|0]<<r21)+1|0;r24=HEAPU8[(r25<<1)+5252685|0];r25=r26+(r24+1)|0;HEAP32[r4]=r25;r13=r27<<r24;r24=r13>>31;r10=r13<<1;HEAP32[r5]=r10;if((r21|0)==0){r30=r7}else{if((r25|0)>0){r13=r1+8|0;r11=HEAP32[r13>>2];r19=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r25|r10;HEAP32[r5]=r19;HEAP32[r13>>2]=r11+2|0;r11=r25-16|0;HEAP32[r4]=r11;r31=r19;r32=r11}else{r31=r10;r32=r25}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r7|0}r28=(r30^r24)-r24|0}}while(0);r30=27-HEAP32[r8>>2]|0;r8=r28+r14<<r30>>r30;HEAP32[r6>>2]=r8;HEAP32[r2+44>>2]=r8;r2=(r1+24|0)>>2;r6=HEAP32[r2];r30=r6<<1;r14=r30+r12|0;r28=(r1+408|0)>>2;r21=HEAP32[r28]<<1;r31=r21+r8|0;r32=HEAP32[r1+48>>2];if(r14>>>0>r32>>>0){r4=(r14|0)<0?0:r32;r33=r4;r34=r4-r30|0}else{r33=r14;r34=r12}r12=HEAP32[r1+52>>2];if(r31>>>0<=r12>>>0){r35=r31;r36=r8;r37=r35<<1;r38=r37&2;r39=r33&1;r40=r38|r39;r41=(r40<<2)+r3|0;r42=HEAP32[r41>>2];r43=r1+12|0;r44=HEAP32[r43>>2];r45=r1+28|0;r46=HEAP32[r45>>2];r47=r44+r6|0;r48=HEAP32[r9>>2];r49=r33>>>1;r50=r35>>>1;r51=Math.imul(r46,r50);r52=r51+r49|0;r53=r48+r52|0;FUNCTION_TABLE[r42](r47,r53,r46,16);r54=(r34|0)/2&-1;r55=(r36|0)/2&-1;r56=r55<<1;r57=r56&2;r58=r54&1;r59=HEAP32[r2];r60=r59+r54|0;r61=r60>>1;r62=HEAP32[r28];r63=r62+r55|0;r64=r63>>>1;r65=r1+32|0,r66=r65>>2;r67=HEAP32[r66];r68=Math.imul(r64,r67);r69=r68+r61|0;r70=r58|r57;r71=r70|4;r72=(r71<<2)+r3|0,r73=r72>>2;r74=HEAP32[r73];r75=r1+16|0;r76=HEAP32[r75>>2];r77=r59>>1;r78=r76+r77|0;r79=r9+4|0;r80=HEAP32[r79>>2];r81=r80+r69|0;FUNCTION_TABLE[r74](r78,r81,r67,8);r82=HEAP32[r73];r83=r1+20|0;r84=HEAP32[r83>>2];r85=HEAP32[r66];r86=HEAP32[r2];r87=r86>>1;r88=r84+r87|0;r89=r9+8|0;r90=HEAP32[r89>>2];r91=r90+r69|0;FUNCTION_TABLE[r82](r88,r91,r85,8);return}r8=(r31|0)<0?0:r12;r35=r8;r36=r8-r21|0;r37=r35<<1;r38=r37&2;r39=r33&1;r40=r38|r39;r41=(r40<<2)+r3|0;r42=HEAP32[r41>>2];r43=r1+12|0;r44=HEAP32[r43>>2];r45=r1+28|0;r46=HEAP32[r45>>2];r47=r44+r6|0;r48=HEAP32[r9>>2];r49=r33>>>1;r50=r35>>>1;r51=Math.imul(r46,r50);r52=r51+r49|0;r53=r48+r52|0;FUNCTION_TABLE[r42](r47,r53,r46,16);r54=(r34|0)/2&-1;r55=(r36|0)/2&-1;r56=r55<<1;r57=r56&2;r58=r54&1;r59=HEAP32[r2];r60=r59+r54|0;r61=r60>>1;r62=HEAP32[r28];r63=r62+r55|0;r64=r63>>>1;r65=r1+32|0,r66=r65>>2;r67=HEAP32[r66];r68=Math.imul(r64,r67);r69=r68+r61|0;r70=r58|r57;r71=r70|4;r72=(r71<<2)+r3|0,r73=r72>>2;r74=HEAP32[r73];r75=r1+16|0;r76=HEAP32[r75>>2];r77=r59>>1;r78=r76+r77|0;r79=r9+4|0;r80=HEAP32[r79>>2];r81=r80+r69|0;FUNCTION_TABLE[r74](r78,r81,r67,8);r82=HEAP32[r73];r83=r1+20|0;r84=HEAP32[r83>>2];r85=HEAP32[r66];r86=HEAP32[r2];r87=r86>>1;r88=r84+r87|0;r89=r9+8|0;r90=HEAP32[r89>>2];r91=r90+r69|0;FUNCTION_TABLE[r82](r88,r91,r85,8);return}function _motion_fi_16x8_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=HEAP32[r2+(r11>>>31<<2)+24>>2]>>2;r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=(r2+48|0)>>2;r13=HEAP32[r12];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12]|0;r13=r14+r8<<r21>>r21;HEAP32[r6>>2]=r13;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2];r8=(r2+52|0)>>2;r21=HEAP32[r8];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r24=r27>>>28;r25=(HEAPU8[(r24<<1)+5252668|0]<<r21)+1|0;r7=HEAPU8[(r24<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r7+1))|0;r24=r27<<r7;r7=r24>>31;r10=r24<<1;HEAP32[r5]=r10;if((r21|0)==0){r29=r25}else{r29=(r10>>>((32-r21|0)>>>0))+r25|0}HEAP32[r5]=r10<<r21;r28=(r29^r7)-r7|0;break}r7=r27>>>22;r10=(HEAPU8[(r7<<1)+5252684|0]<<r21)+1|0;r25=HEAPU8[(r7<<1)+5252685|0];r7=r26+(r25+1)|0;HEAP32[r4]=r7;r24=r27<<r25;r25=r24>>31;r11=r24<<1;HEAP32[r5]=r11;if((r21|0)==0){r30=r10}else{if((r7|0)>0){r24=r1+8|0;r19=HEAP32[r24>>2];r16=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r7|r11;HEAP32[r5]=r16;HEAP32[r24>>2]=r19+2|0;r19=r7-16|0;HEAP32[r4]=r19;r31=r16;r32=r19}else{r31=r11;r32=r7}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r10|0}r28=(r30^r25)-r25|0}}while(0);r30=27-HEAP32[r8]|0;r21=r28+r14<<r30>>r30;HEAP32[r6>>2]=r21;r6=(r1+24|0)>>2;r30=HEAP32[r6];r14=r30<<1;r28=r14+r13|0;r31=(r1+408|0)>>2;r32=HEAP32[r31]<<1;r27=r32+r21|0;r26=r1+48|0;r29=HEAP32[r26>>2];if(r28>>>0>r29>>>0){r25=(r28|0)<0?0:r29;r33=r25;r34=r25-r14|0}else{r33=r28;r34=r13}r13=r1+56|0;r28=HEAP32[r13>>2];if(r27>>>0>r28>>>0){r14=(r27|0)<0?0:r28;r35=r14;r36=r14-r32|0}else{r35=r27;r36=r21}r21=HEAP32[r3+((r35<<1&2|r33&1)<<2)>>2];r27=(r1+12|0)>>2;r32=(r1+28|0)>>2;r14=HEAP32[r32];r28=HEAP32[r27]+r30|0;r30=HEAP32[r9]+Math.imul(r14,r35>>>1)+(r33>>>1)|0;FUNCTION_TABLE[r21](r28,r30,r14,8);r14=(r34|0)/2&-1;r34=(r36|0)/2&-1;r36=HEAP32[r6];r30=(r1+32|0)>>2;r28=HEAP32[r30];r21=(r36+r14>>1)+Math.imul((HEAP32[r31]+r34|0)>>>1,r28)|0;r33=((r14&1|r34<<1&2|4)<<2)+r3|0;r34=(r1+16|0)>>2;FUNCTION_TABLE[HEAP32[r33>>2]]((r36>>1)+HEAP32[r34]|0,HEAP32[r9+1]+r21|0,r28,4);r28=(r1+20|0)>>2;FUNCTION_TABLE[HEAP32[r33>>2]]((HEAP32[r6]>>1)+HEAP32[r28]|0,HEAP32[r9+2]+r21|0,HEAP32[r30],4);r21=HEAP32[r4];if((r21|0)>0){r9=r1+8|0;r33=HEAP32[r9>>2];r36=(HEAPU8[r33]<<8|HEAPU8[r33+1|0])<<r21|HEAP32[r5];HEAP32[r5]=r36;HEAP32[r9>>2]=r33+2|0;r33=r21-16|0;HEAP32[r4]=r33;r37=r33;r38=r36}else{r37=r21;r38=HEAP32[r5]}r21=HEAP32[r2+(r38>>>31<<2)+24>>2];r36=r38<<1;HEAP32[r5]=r36;HEAP32[r4]=r37+1|0;r33=r2+40|0;r9=HEAP32[r33>>2];r14=HEAP32[r12];do{if((r36|0)<0){HEAP32[r5]=r38<<2;HEAP32[r4]=r37+2|0;r39=0}else{if(r36>>>0>201326591){r35=r38>>>27&15;r25=(HEAPU8[(r35<<1)+5252668|0]<<r14)+1|0;r29=HEAPU8[(r35<<1)+5252669|0];HEAP32[r4]=r29+(r37+(r14+2))|0;r35=r36<<r29;r29=r35>>31;r10=r35<<1;HEAP32[r5]=r10;if((r14|0)==0){r40=r25}else{r40=(r10>>>((32-r14|0)>>>0))+r25|0}HEAP32[r5]=r10<<r14;r39=(r40^r29)-r29|0;break}r29=r38>>>21&1023;r10=(HEAPU8[(r29<<1)+5252684|0]<<r14)+1|0;r25=HEAPU8[(r29<<1)+5252685|0];r29=r25+(r37+2)|0;HEAP32[r4]=r29;r35=r36<<r25;r25=r35>>31;r7=r35<<1;HEAP32[r5]=r7;if((r14|0)==0){r41=r10}else{if((r29|0)>0){r35=r1+8|0;r11=HEAP32[r35>>2];r19=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r29|r7;HEAP32[r5]=r19;HEAP32[r35>>2]=r11+2|0;r11=r29-16|0;HEAP32[r4]=r11;r42=r19;r43=r11}else{r42=r7;r43=r29}HEAP32[r5]=r42<<r14;HEAP32[r4]=r43+r14|0;r41=(r42>>>((32-r14|0)>>>0))+r10|0}r39=(r41^r25)-r25|0}}while(0);r41=27-HEAP32[r12]|0;r12=r39+r9<<r41>>r41;HEAP32[r33>>2]=r12;r33=HEAP32[r4];if((r33|0)>0){r41=r1+8|0;r9=HEAP32[r41>>2];r39=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r33|HEAP32[r5];HEAP32[r5]=r39;HEAP32[r41>>2]=r9+2|0;r9=r33-16|0;HEAP32[r4]=r9;r44=r9;r45=r39}else{r44=r33;r45=HEAP32[r5]}r33=r2+44|0;r2=HEAP32[r33>>2];r39=HEAP32[r8];do{if((r45|0)<0){HEAP32[r5]=r45<<1;HEAP32[r4]=r44+1|0;r46=0}else{if(r45>>>0>201326591){r9=r45>>>28;r41=(HEAPU8[(r9<<1)+5252668|0]<<r39)+1|0;r14=HEAPU8[(r9<<1)+5252669|0];HEAP32[r4]=r44+(r39+(r14+1))|0;r9=r45<<r14;r14=r9>>31;r42=r9<<1;HEAP32[r5]=r42;if((r39|0)==0){r47=r41}else{r47=(r42>>>((32-r39|0)>>>0))+r41|0}HEAP32[r5]=r42<<r39;r46=(r47^r14)-r14|0;break}r14=r45>>>22;r42=(HEAPU8[(r14<<1)+5252684|0]<<r39)+1|0;r41=HEAPU8[(r14<<1)+5252685|0];r14=r44+(r41+1)|0;HEAP32[r4]=r14;r9=r45<<r41;r41=r9>>31;r43=r9<<1;HEAP32[r5]=r43;if((r39|0)==0){r48=r42}else{if((r14|0)>0){r9=r1+8|0;r36=HEAP32[r9>>2];r37=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r14|r43;HEAP32[r5]=r37;HEAP32[r9>>2]=r36+2|0;r36=r14-16|0;HEAP32[r4]=r36;r49=r37;r50=r36}else{r49=r43;r50=r14}HEAP32[r5]=r49<<r39;HEAP32[r4]=r50+r39|0;r48=(r49>>>((32-r39|0)>>>0))+r42|0}r46=(r48^r41)-r41|0}}while(0);r48=27-HEAP32[r8]|0;r8=r46+r2<<r48>>r48;HEAP32[r33>>2]=r8;r33=HEAP32[r6];r48=r33<<1;r2=r48+r12|0;r46=HEAP32[r31]<<1;r39=r46+(r8+16)|0;r49=HEAP32[r26>>2];if(r2>>>0>r49>>>0){r26=(r2|0)<0?0:r49;r51=r26;r52=r26-r48|0}else{r51=r2;r52=r12}r12=HEAP32[r13>>2];if(r39>>>0<=r12>>>0){r53=r39;r54=r8;r55=r53<<1;r56=r55&2;r57=r51&1;r58=r56|r57;r59=(r58<<2)+r3|0;r60=HEAP32[r59>>2];r61=HEAP32[r27];r62=HEAP32[r32];r63=r62<<3;r64=r63+r33|0;r65=r61+r64|0;r66=HEAP32[r21>>2];r67=r51>>>1;r68=r53>>>1;r69=Math.imul(r62,r68);r70=r69+r67|0;r71=r66+r70|0;FUNCTION_TABLE[r60](r65,r71,r62,8);r72=(r52|0)/2&-1;r73=(r54|0)/2&-1;r74=r73<<1;r75=r74&2;r76=r72&1;r77=HEAP32[r6];r78=r77+r72|0;r79=r78>>1;r80=HEAP32[r31];r81=r80+r73|0;r82=r81>>>1;r83=r82+4|0;r84=HEAP32[r30];r85=Math.imul(r83,r84);r86=r85+r79|0;r87=r76|r75;r88=r87|4;r89=(r88<<2)+r3|0,r90=r89>>2;r91=HEAP32[r90];r92=HEAP32[r34];r93=r84<<2;r94=r77>>1;r95=r93+r94|0;r96=r92+r95|0;r97=r21+4|0;r98=HEAP32[r97>>2];r99=r98+r86|0;FUNCTION_TABLE[r91](r96,r99,r84,4);r100=HEAP32[r90];r101=HEAP32[r28];r102=HEAP32[r30];r103=r102<<2;r104=HEAP32[r6];r105=r104>>1;r106=r105+r103|0;r107=r101+r106|0;r108=r21+8|0;r109=HEAP32[r108>>2];r110=r109+r86|0;FUNCTION_TABLE[r100](r107,r110,r102,4);return}r8=(r39|0)<0?0:r12;r53=r8;r54=r8-16-r46|0;r55=r53<<1;r56=r55&2;r57=r51&1;r58=r56|r57;r59=(r58<<2)+r3|0;r60=HEAP32[r59>>2];r61=HEAP32[r27];r62=HEAP32[r32];r63=r62<<3;r64=r63+r33|0;r65=r61+r64|0;r66=HEAP32[r21>>2];r67=r51>>>1;r68=r53>>>1;r69=Math.imul(r62,r68);r70=r69+r67|0;r71=r66+r70|0;FUNCTION_TABLE[r60](r65,r71,r62,8);r72=(r52|0)/2&-1;r73=(r54|0)/2&-1;r74=r73<<1;r75=r74&2;r76=r72&1;r77=HEAP32[r6];r78=r77+r72|0;r79=r78>>1;r80=HEAP32[r31];r81=r80+r73|0;r82=r81>>>1;r83=r82+4|0;r84=HEAP32[r30];r85=Math.imul(r83,r84);r86=r85+r79|0;r87=r76|r75;r88=r87|4;r89=(r88<<2)+r3|0,r90=r89>>2;r91=HEAP32[r90];r92=HEAP32[r34];r93=r84<<2;r94=r77>>1;r95=r93+r94|0;r96=r92+r95|0;r97=r21+4|0;r98=HEAP32[r97>>2];r99=r98+r86|0;FUNCTION_TABLE[r91](r96,r99,r84,4);r100=HEAP32[r90];r101=HEAP32[r28];r102=HEAP32[r30];r103=r102<<2;r104=HEAP32[r6];r105=r104>>1;r106=r105+r103|0;r107=r101+r106|0;r108=r21+8|0;r109=HEAP32[r108>>2];r110=r109+r86|0;FUNCTION_TABLE[r100](r107,r110,r102,4);return}function _motion_fi_dmv_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88;r3=r2>>2;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=r2+32|0;r9=HEAP32[r5>>2];r7=r2+48|0;r6=HEAP32[r7>>2];r8=(r1|0)>>2;do{if((r11|0)<0){HEAP32[r8]=r11<<1;HEAP32[r4]=r10+1|0;r12=0}else{if(r11>>>0>201326591){r13=r11>>>28;r14=(HEAPU8[(r13<<1)+5252668|0]<<r6)+1|0;r15=HEAPU8[(r13<<1)+5252669|0];HEAP32[r4]=r10+(r6+(r15+1))|0;r13=r11<<r15;r15=r13>>31;r16=r13<<1;HEAP32[r8]=r16;if((r6|0)==0){r17=r14}else{r17=(r16>>>((32-r6|0)>>>0))+r14|0}HEAP32[r8]=r16<<r6;r12=(r17^r15)-r15|0;break}r15=r11>>>22;r16=(HEAPU8[(r15<<1)+5252684|0]<<r6)+1|0;r14=HEAPU8[(r15<<1)+5252685|0];r15=r10+(r14+1)|0;HEAP32[r4]=r15;r13=r11<<r14;r14=r13>>31;r18=r13<<1;HEAP32[r8]=r18;if((r6|0)==0){r19=r16}else{if((r15|0)>0){r13=r1+8|0;r20=HEAP32[r13>>2];r21=(HEAPU8[r20]<<8|HEAPU8[r20+1|0])<<r15|r18;HEAP32[r8]=r21;HEAP32[r13>>2]=r20+2|0;r20=r15-16|0;HEAP32[r4]=r20;r22=r21;r23=r20}else{r22=r18;r23=r15}HEAP32[r8]=r22<<r6;HEAP32[r4]=r23+r6|0;r19=(r22>>>((32-r6|0)>>>0))+r16|0}r12=(r19^r14)-r14|0}}while(0);r19=27-HEAP32[r7>>2]|0;r7=r12+r9<<r19>>r19;HEAP32[r5>>2]=r7;HEAP32[r3+10]=r7;r5=HEAP32[r4];if((r5|0)>0){r19=r1+8|0;r9=HEAP32[r19>>2];r12=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r5|HEAP32[r8];HEAP32[r8]=r12;HEAP32[r19>>2]=r9+2|0;r9=r5-16|0;HEAP32[r4]=r9;r24=r9;r25=r12}else{r24=r5;r25=HEAP32[r8]}r5=r25>>>30;r12=HEAPU8[(r5<<1)+5253245|0];r9=r25<<r12;HEAP32[r8]=r9;r25=r24+r12|0;HEAP32[r4]=r25;r12=(HEAP8[(r5<<1)+5253244|0]<<24>>24)+(((r7|0)>0&1)+r7>>1)|0;r5=r2+36|0;r24=HEAP32[r5>>2];r19=r2+52|0;r6=HEAP32[r19>>2];do{if((r9|0)<0){HEAP32[r8]=r9<<1;HEAP32[r4]=r25+1|0;r26=0}else{if(r9>>>0>201326591){r22=r9>>>28;r23=(HEAPU8[(r22<<1)+5252668|0]<<r6)+1|0;r11=HEAPU8[(r22<<1)+5252669|0];HEAP32[r4]=r11+(r25+(r6+1))|0;r22=r9<<r11;r11=r22>>31;r10=r22<<1;HEAP32[r8]=r10;if((r6|0)==0){r27=r23}else{r27=(r10>>>((32-r6|0)>>>0))+r23|0}HEAP32[r8]=r10<<r6;r26=(r27^r11)-r11|0;break}r11=r9>>>22;r10=(HEAPU8[(r11<<1)+5252684|0]<<r6)+1|0;r23=HEAPU8[(r11<<1)+5252685|0];r11=r23+(r25+1)|0;HEAP32[r4]=r11;r22=r9<<r23;r23=r22>>31;r17=r22<<1;HEAP32[r8]=r17;if((r6|0)==0){r28=r10}else{if((r11|0)>0){r22=r1+8|0;r14=HEAP32[r22>>2];r16=(HEAPU8[r14]<<8|HEAPU8[r14+1|0])<<r11|r17;HEAP32[r8]=r16;HEAP32[r22>>2]=r14+2|0;r14=r11-16|0;HEAP32[r4]=r14;r29=r16;r30=r14}else{r29=r17;r30=r11}HEAP32[r8]=r29<<r6;HEAP32[r4]=r30+r6|0;r28=(r29>>>((32-r6|0)>>>0))+r10|0}r26=(r28^r23)-r23|0}}while(0);r28=27-HEAP32[r19>>2]|0;r19=r26+r24<<r28>>r28;HEAP32[r5>>2]=r19;HEAP32[r3+11]=r19;r5=HEAP32[r8];r28=r5>>>30;r24=HEAPU8[(r28<<1)+5253245|0];HEAP32[r8]=r5<<r24;HEAP32[r4]=HEAP32[r4]+r24|0;r24=(HEAP8[(r28<<1)+5253244|0]<<24>>24)+(((r19|0)>0&1)+r19>>1)+HEAP32[r1+404>>2]|0;r28=(r1+24|0)>>2;r4=HEAP32[r28];r5=r4<<1;r8=r5+r7|0;r26=(r1+408|0)>>2;r6=HEAP32[r26]<<1;r29=r6+r19|0;r30=r1+48|0;r9=HEAP32[r30>>2];if(r8>>>0>r9>>>0){r25=(r8|0)<0?0:r9;r31=r25;r32=r25-r5|0}else{r31=r8;r32=r7}r7=r1+52|0;r8=HEAP32[r7>>2];if(r29>>>0>r8>>>0){r5=(r29|0)<0?0:r8;r33=r5;r34=r5-r6|0}else{r33=r29;r34=r19}r19=HEAP32[((r33<<1&2|r31&1)<<2)+5243300>>2];r29=(r1+12|0)>>2;r6=(r1+28|0)>>2;r5=HEAP32[r6];r8=HEAP32[r29]+r4|0;r4=HEAP32[r3]+Math.imul(r5,r33>>>1)+(r31>>>1)|0;FUNCTION_TABLE[r19](r8,r4,r5,16);r5=(r32|0)/2&-1;r32=(r34|0)/2&-1;r34=HEAP32[r28];r4=(r1+32|0)>>2;r8=HEAP32[r4];r19=(r34+r5>>1)+Math.imul((HEAP32[r26]+r32|0)>>>1,r8)|0;r31=((r5&1|r32<<1&2|4)<<2)+5243300|0;r32=(r1+16|0)>>2;FUNCTION_TABLE[HEAP32[r31>>2]]((r34>>1)+HEAP32[r32]|0,HEAP32[r3+1]+r19|0,r8,8);r8=(r1+20|0)>>2;FUNCTION_TABLE[HEAP32[r31>>2]]((HEAP32[r28]>>1)+HEAP32[r8]|0,HEAP32[r3+2]+r19|0,HEAP32[r4],8);r19=HEAP32[r28];r3=r19<<1;r31=r3+r12|0;r1=HEAP32[r26]<<1;r34=r1+r24|0;r5=HEAP32[r30>>2];if(r31>>>0>r5>>>0){r30=(r31|0)<0?0:r5;r35=r30;r36=r30-r3|0}else{r35=r31;r36=r12}r12=HEAP32[r7>>2];if(r34>>>0<=r12>>>0){r37=r34;r38=r24;r39=r37<<1;r40=r39&2;r41=r35&1;r42=r40|r41;r43=(r42<<2)+5243332|0;r44=HEAP32[r43>>2];r45=HEAP32[r29];r46=HEAP32[r6];r47=r45+r19|0;r48=r2+12|0;r49=HEAP32[r48>>2];r50=r35>>>1;r51=r37>>>1;r52=Math.imul(r46,r51);r53=r52+r50|0;r54=r49+r53|0;FUNCTION_TABLE[r44](r47,r54,r46,16);r55=(r36|0)/2&-1;r56=(r38|0)/2&-1;r57=r56<<1;r58=r57&2;r59=r55&1;r60=HEAP32[r28];r61=r60+r55|0;r62=r61>>1;r63=HEAP32[r26];r64=r63+r56|0;r65=r64>>>1;r66=HEAP32[r4];r67=Math.imul(r65,r66);r68=r67+r62|0;r69=r59|r58;r70=r69|4;r71=(r70<<2)+5243332|0,r72=r71>>2;r73=HEAP32[r72];r74=HEAP32[r32];r75=r60>>1;r76=r74+r75|0;r77=r2+16|0;r78=HEAP32[r77>>2];r79=r78+r68|0;FUNCTION_TABLE[r73](r76,r79,r66,8);r80=HEAP32[r72];r81=HEAP32[r8];r82=HEAP32[r4];r83=HEAP32[r28];r84=r83>>1;r85=r81+r84|0;r86=r2+20|0;r87=HEAP32[r86>>2];r88=r87+r68|0;FUNCTION_TABLE[r80](r85,r88,r82,8);return}r24=(r34|0)<0?0:r12;r37=r24;r38=r24-r1|0;r39=r37<<1;r40=r39&2;r41=r35&1;r42=r40|r41;r43=(r42<<2)+5243332|0;r44=HEAP32[r43>>2];r45=HEAP32[r29];r46=HEAP32[r6];r47=r45+r19|0;r48=r2+12|0;r49=HEAP32[r48>>2];r50=r35>>>1;r51=r37>>>1;r52=Math.imul(r46,r51);r53=r52+r50|0;r54=r49+r53|0;FUNCTION_TABLE[r44](r47,r54,r46,16);r55=(r36|0)/2&-1;r56=(r38|0)/2&-1;r57=r56<<1;r58=r57&2;r59=r55&1;r60=HEAP32[r28];r61=r60+r55|0;r62=r61>>1;r63=HEAP32[r26];r64=r63+r56|0;r65=r64>>>1;r66=HEAP32[r4];r67=Math.imul(r65,r66);r68=r67+r62|0;r69=r59|r58;r70=r69|4;r71=(r70<<2)+5243332|0,r72=r71>>2;r73=HEAP32[r72];r74=HEAP32[r32];r75=r60>>1;r76=r74+r75|0;r77=r2+16|0;r78=HEAP32[r77>>2];r79=r78+r68|0;FUNCTION_TABLE[r73](r76,r79,r66,8);r80=HEAP32[r72];r81=HEAP32[r8];r82=HEAP32[r4];r83=HEAP32[r28];r84=r83>>1;r85=r81+r84|0;r86=r2+20|0;r87=HEAP32[r86>>2];r88=r87+r68|0;FUNCTION_TABLE[r80](r85,r88,r82,8);return}function _motion_fi_field_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=HEAP32[r2+(r11>>>31<<2)+24>>2];r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=r2+48|0;r13=HEAP32[r12>>2];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12>>2]|0;r12=r14+r8<<r21>>r21;HEAP32[r6>>2]=r12;HEAP32[r2+40>>2]=r12;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2];r8=r2+52|0;r21=HEAP32[r8>>2];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r13=r27>>>28;r24=(HEAPU8[(r13<<1)+5252668|0]<<r21)+1|0;r25=HEAPU8[(r13<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r25+1))|0;r13=r27<<r25;r25=r13>>31;r7=r13<<1;HEAP32[r5]=r7;if((r21|0)==0){r29=r24}else{r29=(r7>>>((32-r21|0)>>>0))+r24|0}HEAP32[r5]=r7<<r21;r28=(r29^r25)-r25|0;break}r25=r27>>>22;r7=(HEAPU8[(r25<<1)+5252684|0]<<r21)+1|0;r24=HEAPU8[(r25<<1)+5252685|0];r25=r26+(r24+1)|0;HEAP32[r4]=r25;r13=r27<<r24;r24=r13>>31;r10=r13<<1;HEAP32[r5]=r10;if((r21|0)==0){r30=r7}else{if((r25|0)>0){r13=r1+8|0;r11=HEAP32[r13>>2];r19=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r25|r10;HEAP32[r5]=r19;HEAP32[r13>>2]=r11+2|0;r11=r25-16|0;HEAP32[r4]=r11;r31=r19;r32=r11}else{r31=r10;r32=r25}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r7|0}r28=(r30^r24)-r24|0}}while(0);r30=27-HEAP32[r8>>2]|0;r8=r28+r14<<r30>>r30;HEAP32[r6>>2]=r8;HEAP32[r2+44>>2]=r8;r2=(r1+24|0)>>2;r6=HEAP32[r2];r30=r6<<1;r14=r30+r12|0;r28=(HEAP32[r1+408>>2]<<1)+r8|0;r8=HEAP32[r1+48>>2];if(r14>>>0>r8>>>0){r21=(r14|0)<0?0:r8;r33=r21;r34=r21-r30|0}else{r33=r14;r34=r12}r12=HEAP32[r1+52>>2];if(r28>>>0<=r12>>>0){r35=r28;r36=r35<<1;r37=r36&2;r38=r33&1;r39=r37|r38;r40=r33>>>1;r41=r35>>>1;r42=r1+28|0;r43=HEAP32[r42>>2];r44=Math.imul(r41,r43);r45=r44+r40|0;r46=(r39<<2)+r3|0;r47=HEAP32[r46>>2];r48=r1+12|0;r49=HEAP32[r48>>2];r50=r49+r6|0;r51=HEAP32[r9>>2];r52=r51+r45|0;FUNCTION_TABLE[r47](r50,r52,r43,16);r53=r34>>>31;r54=r53&r34;r55=r45+r54|0;r56=r55>>>1;r57=(r34|0)/2&-1;r58=r57&1;r59=r37|r58;r60=r59|4;r61=(r60<<2)+r3|0,r62=r61>>2;r63=HEAP32[r62];r64=r1+16|0;r65=HEAP32[r64>>2];r66=r1+32|0,r67=r66>>2;r68=HEAP32[r67];r69=HEAP32[r2];r70=r69>>1;r71=r65+r70|0;r72=r9+4|0;r73=HEAP32[r72>>2];r74=r73+r56|0;FUNCTION_TABLE[r63](r71,r74,r68,16);r75=HEAP32[r62];r76=r1+20|0;r77=HEAP32[r76>>2];r78=HEAP32[r67];r79=HEAP32[r2];r80=r79>>1;r81=r77+r80|0;r82=r9+8|0;r83=HEAP32[r82>>2];r84=r83+r56|0;FUNCTION_TABLE[r75](r81,r84,r78,16);return}r35=(r28|0)<0?0:r12;r36=r35<<1;r37=r36&2;r38=r33&1;r39=r37|r38;r40=r33>>>1;r41=r35>>>1;r42=r1+28|0;r43=HEAP32[r42>>2];r44=Math.imul(r41,r43);r45=r44+r40|0;r46=(r39<<2)+r3|0;r47=HEAP32[r46>>2];r48=r1+12|0;r49=HEAP32[r48>>2];r50=r49+r6|0;r51=HEAP32[r9>>2];r52=r51+r45|0;FUNCTION_TABLE[r47](r50,r52,r43,16);r53=r34>>>31;r54=r53&r34;r55=r45+r54|0;r56=r55>>>1;r57=(r34|0)/2&-1;r58=r57&1;r59=r37|r58;r60=r59|4;r61=(r60<<2)+r3|0,r62=r61>>2;r63=HEAP32[r62];r64=r1+16|0;r65=HEAP32[r64>>2];r66=r1+32|0,r67=r66>>2;r68=HEAP32[r67];r69=HEAP32[r2];r70=r69>>1;r71=r65+r70|0;r72=r9+4|0;r73=HEAP32[r72>>2];r74=r73+r56|0;FUNCTION_TABLE[r63](r71,r74,r68,16);r75=HEAP32[r62];r76=r1+20|0;r77=HEAP32[r76>>2];r78=HEAP32[r67];r79=HEAP32[r2];r80=r79>>1;r81=r77+r80|0;r82=r9+8|0;r83=HEAP32[r82>>2];r84=r83+r56|0;FUNCTION_TABLE[r75](r81,r84,r78,16);return}function _motion_fi_16x8_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=HEAP32[r2+(r11>>>31<<2)+24>>2]>>2;r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=(r2+48|0)>>2;r13=HEAP32[r12];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12]|0;r13=r14+r8<<r21>>r21;HEAP32[r6>>2]=r13;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2];r8=(r2+52|0)>>2;r21=HEAP32[r8];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r24=r27>>>28;r25=(HEAPU8[(r24<<1)+5252668|0]<<r21)+1|0;r7=HEAPU8[(r24<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r7+1))|0;r24=r27<<r7;r7=r24>>31;r10=r24<<1;HEAP32[r5]=r10;if((r21|0)==0){r29=r25}else{r29=(r10>>>((32-r21|0)>>>0))+r25|0}HEAP32[r5]=r10<<r21;r28=(r29^r7)-r7|0;break}r7=r27>>>22;r10=(HEAPU8[(r7<<1)+5252684|0]<<r21)+1|0;r25=HEAPU8[(r7<<1)+5252685|0];r7=r26+(r25+1)|0;HEAP32[r4]=r7;r24=r27<<r25;r25=r24>>31;r11=r24<<1;HEAP32[r5]=r11;if((r21|0)==0){r30=r10}else{if((r7|0)>0){r24=r1+8|0;r19=HEAP32[r24>>2];r16=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r7|r11;HEAP32[r5]=r16;HEAP32[r24>>2]=r19+2|0;r19=r7-16|0;HEAP32[r4]=r19;r31=r16;r32=r19}else{r31=r11;r32=r7}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r10|0}r28=(r30^r25)-r25|0}}while(0);r30=27-HEAP32[r8]|0;r21=r28+r14<<r30>>r30;HEAP32[r6>>2]=r21;r6=(r1+24|0)>>2;r30=HEAP32[r6];r14=r30<<1;r28=r14+r13|0;r31=r1+408|0;r32=(HEAP32[r31>>2]<<1)+r21|0;r21=r1+48|0;r27=HEAP32[r21>>2];if(r28>>>0>r27>>>0){r26=(r28|0)<0?0:r27;r33=r26;r34=r26-r14|0}else{r33=r28;r34=r13}r13=r1+56|0;r28=HEAP32[r13>>2];if(r32>>>0>r28>>>0){r35=(r32|0)<0?0:r28}else{r35=r32}r32=r35<<1&2;r28=(r1+28|0)>>2;r14=HEAP32[r28];r26=Math.imul(r35>>>1,r14)+(r33>>>1)|0;r35=(r1+12|0)>>2;FUNCTION_TABLE[HEAP32[r3+((r32|r33&1)<<2)>>2]](HEAP32[r35]+r30|0,HEAP32[r9]+r26|0,r14,8);r14=(r26+(r34>>>31&r34)|0)>>>1;r26=((r32|(r34|0)/2&-1&1|4)<<2)+r3|0;r34=(r1+16|0)>>2;r32=(r1+32|0)>>2;FUNCTION_TABLE[HEAP32[r26>>2]]((HEAP32[r6]>>1)+HEAP32[r34]|0,HEAP32[r9+1]+r14|0,HEAP32[r32],8);r30=(r1+20|0)>>2;FUNCTION_TABLE[HEAP32[r26>>2]]((HEAP32[r6]>>1)+HEAP32[r30]|0,HEAP32[r9+2]+r14|0,HEAP32[r32],8);r14=HEAP32[r4];if((r14|0)>0){r9=r1+8|0;r26=HEAP32[r9>>2];r33=(HEAPU8[r26]<<8|HEAPU8[r26+1|0])<<r14|HEAP32[r5];HEAP32[r5]=r33;HEAP32[r9>>2]=r26+2|0;r26=r14-16|0;HEAP32[r4]=r26;r36=r26;r37=r33}else{r36=r14;r37=HEAP32[r5]}r14=HEAP32[r2+(r37>>>31<<2)+24>>2];r33=r37<<1;HEAP32[r5]=r33;HEAP32[r4]=r36+1|0;r26=r2+40|0;r9=HEAP32[r26>>2];r27=HEAP32[r12];do{if((r33|0)<0){HEAP32[r5]=r37<<2;HEAP32[r4]=r36+2|0;r38=0}else{if(r33>>>0>201326591){r29=r37>>>27&15;r25=(HEAPU8[(r29<<1)+5252668|0]<<r27)+1|0;r10=HEAPU8[(r29<<1)+5252669|0];HEAP32[r4]=r10+(r36+(r27+2))|0;r29=r33<<r10;r10=r29>>31;r7=r29<<1;HEAP32[r5]=r7;if((r27|0)==0){r39=r25}else{r39=(r7>>>((32-r27|0)>>>0))+r25|0}HEAP32[r5]=r7<<r27;r38=(r39^r10)-r10|0;break}r10=r37>>>21&1023;r7=(HEAPU8[(r10<<1)+5252684|0]<<r27)+1|0;r25=HEAPU8[(r10<<1)+5252685|0];r10=r25+(r36+2)|0;HEAP32[r4]=r10;r29=r33<<r25;r25=r29>>31;r11=r29<<1;HEAP32[r5]=r11;if((r27|0)==0){r40=r7}else{if((r10|0)>0){r29=r1+8|0;r19=HEAP32[r29>>2];r16=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r10|r11;HEAP32[r5]=r16;HEAP32[r29>>2]=r19+2|0;r19=r10-16|0;HEAP32[r4]=r19;r41=r16;r42=r19}else{r41=r11;r42=r10}HEAP32[r5]=r41<<r27;HEAP32[r4]=r42+r27|0;r40=(r41>>>((32-r27|0)>>>0))+r7|0}r38=(r40^r25)-r25|0}}while(0);r40=27-HEAP32[r12]|0;r12=r38+r9<<r40>>r40;HEAP32[r26>>2]=r12;r26=HEAP32[r4];if((r26|0)>0){r40=r1+8|0;r9=HEAP32[r40>>2];r38=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r26|HEAP32[r5];HEAP32[r5]=r38;HEAP32[r40>>2]=r9+2|0;r9=r26-16|0;HEAP32[r4]=r9;r43=r9;r44=r38}else{r43=r26;r44=HEAP32[r5]}r26=r2+44|0;r2=HEAP32[r26>>2];r38=HEAP32[r8];do{if((r44|0)<0){HEAP32[r5]=r44<<1;HEAP32[r4]=r43+1|0;r45=0}else{if(r44>>>0>201326591){r9=r44>>>28;r40=(HEAPU8[(r9<<1)+5252668|0]<<r38)+1|0;r27=HEAPU8[(r9<<1)+5252669|0];HEAP32[r4]=r43+(r38+(r27+1))|0;r9=r44<<r27;r27=r9>>31;r41=r9<<1;HEAP32[r5]=r41;if((r38|0)==0){r46=r40}else{r46=(r41>>>((32-r38|0)>>>0))+r40|0}HEAP32[r5]=r41<<r38;r45=(r46^r27)-r27|0;break}r27=r44>>>22;r41=(HEAPU8[(r27<<1)+5252684|0]<<r38)+1|0;r40=HEAPU8[(r27<<1)+5252685|0];r27=r43+(r40+1)|0;HEAP32[r4]=r27;r9=r44<<r40;r40=r9>>31;r42=r9<<1;HEAP32[r5]=r42;if((r38|0)==0){r47=r41}else{if((r27|0)>0){r9=r1+8|0;r33=HEAP32[r9>>2];r36=(HEAPU8[r33]<<8|HEAPU8[r33+1|0])<<r27|r42;HEAP32[r5]=r36;HEAP32[r9>>2]=r33+2|0;r33=r27-16|0;HEAP32[r4]=r33;r48=r36;r49=r33}else{r48=r42;r49=r27}HEAP32[r5]=r48<<r38;HEAP32[r4]=r49+r38|0;r47=(r48>>>((32-r38|0)>>>0))+r41|0}r45=(r47^r40)-r40|0}}while(0);r47=27-HEAP32[r8]|0;r8=r45+r2<<r47>>r47;HEAP32[r26>>2]=r8;r26=HEAP32[r6];r47=r26<<1;r2=r47+r12|0;r45=(HEAP32[r31>>2]<<1)+r8+16|0;r8=HEAP32[r21>>2];if(r2>>>0>r8>>>0){r21=(r2|0)<0?0:r8;r50=r21;r51=r21-r47|0}else{r50=r2;r51=r12}r12=HEAP32[r13>>2];if(r45>>>0<=r12>>>0){r52=r45;r53=r52<<1;r54=r53&2;r55=r50&1;r56=r54|r55;r57=r50>>>1;r58=r52>>>1;r59=HEAP32[r28];r60=Math.imul(r58,r59);r61=r60+r57|0;r62=(r56<<2)+r3|0;r63=HEAP32[r62>>2];r64=HEAP32[r35];r65=r59<<3;r66=r26+r65|0;r67=r64+r66|0;r68=HEAP32[r14>>2];r69=r68+r61|0;FUNCTION_TABLE[r63](r67,r69,r59,8);r70=r51>>>31;r71=r70&r51;r72=r61+r71|0;r73=r72>>>1;r74=(r51|0)/2&-1;r75=r74&1;r76=r54|r75;r77=r76|4;r78=(r77<<2)+r3|0,r79=r78>>2;r80=HEAP32[r79];r81=HEAP32[r34];r82=HEAP32[r32];r83=r82<<3;r84=HEAP32[r6];r85=r84>>1;r86=r85+r83|0;r87=r81+r86|0;r88=r14+4|0;r89=HEAP32[r88>>2];r90=r89+r73|0;FUNCTION_TABLE[r80](r87,r90,r82,8);r91=HEAP32[r79];r92=HEAP32[r30];r93=HEAP32[r32];r94=r93<<3;r95=HEAP32[r6];r96=r95>>1;r97=r96+r94|0;r98=r92+r97|0;r99=r14+8|0;r100=HEAP32[r99>>2];r101=r100+r73|0;FUNCTION_TABLE[r91](r98,r101,r93,8);return}r52=(r45|0)<0?0:r12;r53=r52<<1;r54=r53&2;r55=r50&1;r56=r54|r55;r57=r50>>>1;r58=r52>>>1;r59=HEAP32[r28];r60=Math.imul(r58,r59);r61=r60+r57|0;r62=(r56<<2)+r3|0;r63=HEAP32[r62>>2];r64=HEAP32[r35];r65=r59<<3;r66=r26+r65|0;r67=r64+r66|0;r68=HEAP32[r14>>2];r69=r68+r61|0;FUNCTION_TABLE[r63](r67,r69,r59,8);r70=r51>>>31;r71=r70&r51;r72=r61+r71|0;r73=r72>>>1;r74=(r51|0)/2&-1;r75=r74&1;r76=r54|r75;r77=r76|4;r78=(r77<<2)+r3|0,r79=r78>>2;r80=HEAP32[r79];r81=HEAP32[r34];r82=HEAP32[r32];r83=r82<<3;r84=HEAP32[r6];r85=r84>>1;r86=r85+r83|0;r87=r81+r86|0;r88=r14+4|0;r89=HEAP32[r88>>2];r90=r89+r73|0;FUNCTION_TABLE[r80](r87,r90,r82,8);r91=HEAP32[r79];r92=HEAP32[r30];r93=HEAP32[r32];r94=r93<<3;r95=HEAP32[r6];r96=r95>>1;r97=r96+r94|0;r98=r92+r97|0;r99=r14+8|0;r100=HEAP32[r99>>2];r101=r100+r73|0;FUNCTION_TABLE[r91](r98,r101,r93,8);return}function _motion_fi_dmv_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80;r3=r2>>2;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=r2+32|0;r9=HEAP32[r5>>2];r7=r2+48|0;r6=HEAP32[r7>>2];r8=(r1|0)>>2;do{if((r11|0)<0){HEAP32[r8]=r11<<1;HEAP32[r4]=r10+1|0;r12=0}else{if(r11>>>0>201326591){r13=r11>>>28;r14=(HEAPU8[(r13<<1)+5252668|0]<<r6)+1|0;r15=HEAPU8[(r13<<1)+5252669|0];HEAP32[r4]=r10+(r6+(r15+1))|0;r13=r11<<r15;r15=r13>>31;r16=r13<<1;HEAP32[r8]=r16;if((r6|0)==0){r17=r14}else{r17=(r16>>>((32-r6|0)>>>0))+r14|0}HEAP32[r8]=r16<<r6;r12=(r17^r15)-r15|0;break}r15=r11>>>22;r16=(HEAPU8[(r15<<1)+5252684|0]<<r6)+1|0;r14=HEAPU8[(r15<<1)+5252685|0];r15=r10+(r14+1)|0;HEAP32[r4]=r15;r13=r11<<r14;r14=r13>>31;r18=r13<<1;HEAP32[r8]=r18;if((r6|0)==0){r19=r16}else{if((r15|0)>0){r13=r1+8|0;r20=HEAP32[r13>>2];r21=(HEAPU8[r20]<<8|HEAPU8[r20+1|0])<<r15|r18;HEAP32[r8]=r21;HEAP32[r13>>2]=r20+2|0;r20=r15-16|0;HEAP32[r4]=r20;r22=r21;r23=r20}else{r22=r18;r23=r15}HEAP32[r8]=r22<<r6;HEAP32[r4]=r23+r6|0;r19=(r22>>>((32-r6|0)>>>0))+r16|0}r12=(r19^r14)-r14|0}}while(0);r19=27-HEAP32[r7>>2]|0;r7=r12+r9<<r19>>r19;HEAP32[r5>>2]=r7;HEAP32[r3+10]=r7;r5=HEAP32[r4];if((r5|0)>0){r19=r1+8|0;r9=HEAP32[r19>>2];r12=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r5|HEAP32[r8];HEAP32[r8]=r12;HEAP32[r19>>2]=r9+2|0;r9=r5-16|0;HEAP32[r4]=r9;r24=r9;r25=r12}else{r24=r5;r25=HEAP32[r8]}r5=r25>>>30;r12=HEAPU8[(r5<<1)+5253245|0];r9=r25<<r12;HEAP32[r8]=r9;r25=r24+r12|0;HEAP32[r4]=r25;r12=(HEAP8[(r5<<1)+5253244|0]<<24>>24)+(((r7|0)>0&1)+r7>>1)|0;r5=r2+36|0;r24=HEAP32[r5>>2];r19=r2+52|0;r6=HEAP32[r19>>2];do{if((r9|0)<0){HEAP32[r8]=r9<<1;HEAP32[r4]=r25+1|0;r26=0}else{if(r9>>>0>201326591){r22=r9>>>28;r23=(HEAPU8[(r22<<1)+5252668|0]<<r6)+1|0;r11=HEAPU8[(r22<<1)+5252669|0];HEAP32[r4]=r11+(r25+(r6+1))|0;r22=r9<<r11;r11=r22>>31;r10=r22<<1;HEAP32[r8]=r10;if((r6|0)==0){r27=r23}else{r27=(r10>>>((32-r6|0)>>>0))+r23|0}HEAP32[r8]=r10<<r6;r26=(r27^r11)-r11|0;break}r11=r9>>>22;r10=(HEAPU8[(r11<<1)+5252684|0]<<r6)+1|0;r23=HEAPU8[(r11<<1)+5252685|0];r11=r23+(r25+1)|0;HEAP32[r4]=r11;r22=r9<<r23;r23=r22>>31;r17=r22<<1;HEAP32[r8]=r17;if((r6|0)==0){r28=r10}else{if((r11|0)>0){r22=r1+8|0;r14=HEAP32[r22>>2];r16=(HEAPU8[r14]<<8|HEAPU8[r14+1|0])<<r11|r17;HEAP32[r8]=r16;HEAP32[r22>>2]=r14+2|0;r14=r11-16|0;HEAP32[r4]=r14;r29=r16;r30=r14}else{r29=r17;r30=r11}HEAP32[r8]=r29<<r6;HEAP32[r4]=r30+r6|0;r28=(r29>>>((32-r6|0)>>>0))+r10|0}r26=(r28^r23)-r23|0}}while(0);r28=27-HEAP32[r19>>2]|0;r19=r26+r24<<r28>>r28;HEAP32[r5>>2]=r19;HEAP32[r3+11]=r19;r5=HEAP32[r8];r28=r5>>>30;r24=HEAPU8[(r28<<1)+5253245|0];HEAP32[r8]=r5<<r24;HEAP32[r4]=HEAP32[r4]+r24|0;r24=HEAP8[(r28<<1)+5253244|0]<<24>>24;r28=HEAP32[r1+404>>2];r4=(r1+24|0)>>2;r5=HEAP32[r4];r8=r5<<1;r26=r8+r7|0;r6=r1+408|0;r29=(HEAP32[r6>>2]<<1)+r19|0;r30=r1+48|0;r9=HEAP32[r30>>2];if(r26>>>0>r9>>>0){r25=(r26|0)<0?0:r9;r31=r25;r32=r25-r8|0}else{r31=r26;r32=r7}r7=r1+52|0;r26=HEAP32[r7>>2];if(r29>>>0>r26>>>0){r33=(r29|0)<0?0:r26}else{r33=r29}r29=r33<<1&2;r26=(r1+28|0)>>2;r8=HEAP32[r26];r25=Math.imul(r33>>>1,r8)+(r31>>>1)|0;r33=(r1+12|0)>>2;FUNCTION_TABLE[HEAP32[((r29|r31&1)<<2)+5243300>>2]](HEAP32[r33]+r5|0,HEAP32[r3]+r25|0,r8,16);r8=(r25+(r32>>>31&r32)|0)>>>1;r25=((r29|(r32|0)/2&-1&1|4)<<2)+5243300|0;r32=(r1+16|0)>>2;r29=(r1+32|0)>>2;FUNCTION_TABLE[HEAP32[r25>>2]]((HEAP32[r4]>>1)+HEAP32[r32]|0,HEAP32[r3+1]+r8|0,HEAP32[r29],16);r5=(r1+20|0)>>2;FUNCTION_TABLE[HEAP32[r25>>2]]((HEAP32[r4]>>1)+HEAP32[r5]|0,HEAP32[r3+2]+r8|0,HEAP32[r29],16);r8=HEAP32[r4];r3=r8<<1;r25=r3+r12|0;r1=(((r19|0)>0&1)+r19>>1)+(HEAP32[r6>>2]<<1)+r28+r24|0;r24=HEAP32[r30>>2];if(r25>>>0>r24>>>0){r30=(r25|0)<0?0:r24;r34=r30;r35=r30-r3|0}else{r34=r25;r35=r12}r12=HEAP32[r7>>2];if(r1>>>0<=r12>>>0){r36=r1;r37=r36<<1;r38=r37&2;r39=r34&1;r40=r38|r39;r41=r34>>>1;r42=r36>>>1;r43=HEAP32[r26];r44=Math.imul(r42,r43);r45=r44+r41|0;r46=(r40<<2)+5243332|0;r47=HEAP32[r46>>2];r48=HEAP32[r33];r49=r48+r8|0;r50=r2+12|0;r51=HEAP32[r50>>2];r52=r51+r45|0;FUNCTION_TABLE[r47](r49,r52,r43,16);r53=r35>>>31;r54=r53&r35;r55=r45+r54|0;r56=r55>>>1;r57=(r35|0)/2&-1;r58=r57&1;r59=r38|r58;r60=r59|4;r61=(r60<<2)+5243332|0,r62=r61>>2;r63=HEAP32[r62];r64=HEAP32[r32];r65=HEAP32[r29];r66=HEAP32[r4];r67=r66>>1;r68=r64+r67|0;r69=r2+16|0;r70=HEAP32[r69>>2];r71=r70+r56|0;FUNCTION_TABLE[r63](r68,r71,r65,16);r72=HEAP32[r62];r73=HEAP32[r5];r74=HEAP32[r29];r75=HEAP32[r4];r76=r75>>1;r77=r73+r76|0;r78=r2+20|0;r79=HEAP32[r78>>2];r80=r79+r56|0;FUNCTION_TABLE[r72](r77,r80,r74,16);return}r36=(r1|0)<0?0:r12;r37=r36<<1;r38=r37&2;r39=r34&1;r40=r38|r39;r41=r34>>>1;r42=r36>>>1;r43=HEAP32[r26];r44=Math.imul(r42,r43);r45=r44+r41|0;r46=(r40<<2)+5243332|0;r47=HEAP32[r46>>2];r48=HEAP32[r33];r49=r48+r8|0;r50=r2+12|0;r51=HEAP32[r50>>2];r52=r51+r45|0;FUNCTION_TABLE[r47](r49,r52,r43,16);r53=r35>>>31;r54=r53&r35;r55=r45+r54|0;r56=r55>>>1;r57=(r35|0)/2&-1;r58=r57&1;r59=r38|r58;r60=r59|4;r61=(r60<<2)+5243332|0,r62=r61>>2;r63=HEAP32[r62];r64=HEAP32[r32];r65=HEAP32[r29];r66=HEAP32[r4];r67=r66>>1;r68=r64+r67|0;r69=r2+16|0;r70=HEAP32[r69>>2];r71=r70+r56|0;FUNCTION_TABLE[r63](r68,r71,r65,16);r72=HEAP32[r62];r73=HEAP32[r5];r74=HEAP32[r29];r75=HEAP32[r4];r76=r75>>1;r77=r73+r76|0;r78=r2+20|0;r79=HEAP32[r78>>2];r80=r79+r56|0;FUNCTION_TABLE[r72](r77,r80,r74,16);return}function _motion_fi_field_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=HEAP32[r2+(r11>>>31<<2)+24>>2];r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=r2+48|0;r13=HEAP32[r12>>2];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12>>2]|0;r12=r14+r8<<r21>>r21;HEAP32[r6>>2]=r12;HEAP32[r2+40>>2]=r12;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2];r8=r2+52|0;r21=HEAP32[r8>>2];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r13=r27>>>28;r24=(HEAPU8[(r13<<1)+5252668|0]<<r21)+1|0;r25=HEAPU8[(r13<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r25+1))|0;r13=r27<<r25;r25=r13>>31;r7=r13<<1;HEAP32[r5]=r7;if((r21|0)==0){r29=r24}else{r29=(r7>>>((32-r21|0)>>>0))+r24|0}HEAP32[r5]=r7<<r21;r28=(r29^r25)-r25|0;break}r25=r27>>>22;r7=(HEAPU8[(r25<<1)+5252684|0]<<r21)+1|0;r24=HEAPU8[(r25<<1)+5252685|0];r25=r26+(r24+1)|0;HEAP32[r4]=r25;r13=r27<<r24;r24=r13>>31;r10=r13<<1;HEAP32[r5]=r10;if((r21|0)==0){r30=r7}else{if((r25|0)>0){r13=r1+8|0;r11=HEAP32[r13>>2];r19=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r25|r10;HEAP32[r5]=r19;HEAP32[r13>>2]=r11+2|0;r11=r25-16|0;HEAP32[r4]=r11;r31=r19;r32=r11}else{r31=r10;r32=r25}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r7|0}r28=(r30^r24)-r24|0}}while(0);r30=27-HEAP32[r8>>2]|0;r8=r28+r14<<r30>>r30;HEAP32[r6>>2]=r8;HEAP32[r2+44>>2]=r8;r2=(r1+24|0)>>2;r6=HEAP32[r2];r30=(r6<<1)+r12|0;r12=(HEAP32[r1+408>>2]<<1)+r8|0;r8=HEAP32[r1+48>>2];if(r30>>>0>r8>>>0){r33=(r30|0)<0?0:r8}else{r33=r30}r30=HEAP32[r1+52>>2];if(r12>>>0<=r30>>>0){r34=r12;r35=r34<<1;r36=r35&2;r37=r33&1;r38=r36|r37;r39=r33>>>1;r40=r34>>>1;r41=r1+28|0,r42=r41>>2;r43=HEAP32[r42];r44=Math.imul(r40,r43);r45=r44+r39|0;r46=(r38<<2)+r3|0,r47=r46>>2;r48=HEAP32[r47];r49=r1+12|0;r50=HEAP32[r49>>2];r51=r50+r6|0;r52=HEAP32[r9>>2];r53=r52+r45|0;FUNCTION_TABLE[r48](r51,r53,r43,16);r54=HEAP32[r47];r55=r1+16|0;r56=HEAP32[r55>>2];r57=HEAP32[r42];r58=HEAP32[r2];r59=r56+r58|0;r60=r9+4|0;r61=HEAP32[r60>>2];r62=r61+r45|0;FUNCTION_TABLE[r54](r59,r62,r57,16);r63=HEAP32[r47];r64=r1+20|0;r65=HEAP32[r64>>2];r66=HEAP32[r42];r67=HEAP32[r2];r68=r65+r67|0;r69=r9+8|0;r70=HEAP32[r69>>2];r71=r70+r45|0;FUNCTION_TABLE[r63](r68,r71,r66,16);return}r34=(r12|0)<0?0:r30;r35=r34<<1;r36=r35&2;r37=r33&1;r38=r36|r37;r39=r33>>>1;r40=r34>>>1;r41=r1+28|0,r42=r41>>2;r43=HEAP32[r42];r44=Math.imul(r40,r43);r45=r44+r39|0;r46=(r38<<2)+r3|0,r47=r46>>2;r48=HEAP32[r47];r49=r1+12|0;r50=HEAP32[r49>>2];r51=r50+r6|0;r52=HEAP32[r9>>2];r53=r52+r45|0;FUNCTION_TABLE[r48](r51,r53,r43,16);r54=HEAP32[r47];r55=r1+16|0;r56=HEAP32[r55>>2];r57=HEAP32[r42];r58=HEAP32[r2];r59=r56+r58|0;r60=r9+4|0;r61=HEAP32[r60>>2];r62=r61+r45|0;FUNCTION_TABLE[r54](r59,r62,r57,16);r63=HEAP32[r47];r64=r1+20|0;r65=HEAP32[r64>>2];r66=HEAP32[r42];r67=HEAP32[r2];r68=r65+r67|0;r69=r9+8|0;r70=HEAP32[r69>>2];r71=r70+r45|0;FUNCTION_TABLE[r63](r68,r71,r66,16);return}function _motion_fi_16x8_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=(r1|0)>>2;r9=HEAP32[r2+(r11>>>31<<2)+24>>2]>>2;r7=r11<<1;HEAP32[r5]=r7;HEAP32[r4]=r10+1|0;r6=r2+32|0;r8=HEAP32[r6>>2];r12=(r2+48|0)>>2;r13=HEAP32[r12];do{if((r7|0)<0){HEAP32[r5]=r11<<2;HEAP32[r4]=r10+2|0;r14=0}else{if(r7>>>0>201326591){r15=r11>>>27&15;r16=(HEAPU8[(r15<<1)+5252668|0]<<r13)+1|0;r17=HEAPU8[(r15<<1)+5252669|0];HEAP32[r4]=r17+(r10+(r13+2))|0;r15=r7<<r17;r17=r15>>31;r18=r15<<1;HEAP32[r5]=r18;if((r13|0)==0){r19=r16}else{r19=(r18>>>((32-r13|0)>>>0))+r16|0}HEAP32[r5]=r18<<r13;r14=(r19^r17)-r17|0;break}r17=r11>>>21&1023;r18=(HEAPU8[(r17<<1)+5252684|0]<<r13)+1|0;r16=HEAPU8[(r17<<1)+5252685|0];r17=r16+(r10+2)|0;HEAP32[r4]=r17;r15=r7<<r16;r16=r15>>31;r20=r15<<1;HEAP32[r5]=r20;if((r13|0)==0){r21=r18}else{if((r17|0)>0){r15=r1+8|0;r22=HEAP32[r15>>2];r23=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r17|r20;HEAP32[r5]=r23;HEAP32[r15>>2]=r22+2|0;r22=r17-16|0;HEAP32[r4]=r22;r24=r23;r25=r22}else{r24=r20;r25=r17}HEAP32[r5]=r24<<r13;HEAP32[r4]=r25+r13|0;r21=(r24>>>((32-r13|0)>>>0))+r18|0}r14=(r21^r16)-r16|0}}while(0);r21=27-HEAP32[r12]|0;r13=r14+r8<<r21>>r21;HEAP32[r6>>2]=r13;r6=HEAP32[r4];if((r6|0)>0){r21=r1+8|0;r8=HEAP32[r21>>2];r14=(HEAPU8[r8]<<8|HEAPU8[r8+1|0])<<r6|HEAP32[r5];HEAP32[r5]=r14;HEAP32[r21>>2]=r8+2|0;r8=r6-16|0;HEAP32[r4]=r8;r26=r8;r27=r14}else{r26=r6;r27=HEAP32[r5]}r6=r2+36|0;r14=HEAP32[r6>>2];r8=(r2+52|0)>>2;r21=HEAP32[r8];do{if((r27|0)<0){HEAP32[r5]=r27<<1;HEAP32[r4]=r26+1|0;r28=0}else{if(r27>>>0>201326591){r24=r27>>>28;r25=(HEAPU8[(r24<<1)+5252668|0]<<r21)+1|0;r7=HEAPU8[(r24<<1)+5252669|0];HEAP32[r4]=r26+(r21+(r7+1))|0;r24=r27<<r7;r7=r24>>31;r10=r24<<1;HEAP32[r5]=r10;if((r21|0)==0){r29=r25}else{r29=(r10>>>((32-r21|0)>>>0))+r25|0}HEAP32[r5]=r10<<r21;r28=(r29^r7)-r7|0;break}r7=r27>>>22;r10=(HEAPU8[(r7<<1)+5252684|0]<<r21)+1|0;r25=HEAPU8[(r7<<1)+5252685|0];r7=r26+(r25+1)|0;HEAP32[r4]=r7;r24=r27<<r25;r25=r24>>31;r11=r24<<1;HEAP32[r5]=r11;if((r21|0)==0){r30=r10}else{if((r7|0)>0){r24=r1+8|0;r19=HEAP32[r24>>2];r16=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r7|r11;HEAP32[r5]=r16;HEAP32[r24>>2]=r19+2|0;r19=r7-16|0;HEAP32[r4]=r19;r31=r16;r32=r19}else{r31=r11;r32=r7}HEAP32[r5]=r31<<r21;HEAP32[r4]=r32+r21|0;r30=(r31>>>((32-r21|0)>>>0))+r10|0}r28=(r30^r25)-r25|0}}while(0);r30=27-HEAP32[r8]|0;r21=r28+r14<<r30>>r30;HEAP32[r6>>2]=r21;r6=(r1+24|0)>>2;r30=HEAP32[r6];r14=(r30<<1)+r13|0;r13=r1+408|0;r28=(HEAP32[r13>>2]<<1)+r21|0;r21=r1+48|0;r31=HEAP32[r21>>2];if(r14>>>0>r31>>>0){r33=(r14|0)<0?0:r31}else{r33=r14}r14=r1+56|0;r31=HEAP32[r14>>2];if(r28>>>0>r31>>>0){r34=(r28|0)<0?0:r31}else{r34=r28}r28=(r1+28|0)>>2;r31=HEAP32[r28];r32=Math.imul(r34>>>1,r31)+(r33>>>1)|0;r27=(((r34<<1&2|r33&1)<<2)+r3|0)>>2;r33=(r1+12|0)>>2;FUNCTION_TABLE[HEAP32[r27]](HEAP32[r33]+r30|0,HEAP32[r9]+r32|0,r31,8);r31=(r1+16|0)>>2;FUNCTION_TABLE[HEAP32[r27]](HEAP32[r31]+HEAP32[r6]|0,HEAP32[r9+1]+r32|0,HEAP32[r28],8);r30=(r1+20|0)>>2;FUNCTION_TABLE[HEAP32[r27]](HEAP32[r30]+HEAP32[r6]|0,HEAP32[r9+2]+r32|0,HEAP32[r28],8);r32=HEAP32[r4];if((r32|0)>0){r9=r1+8|0;r27=HEAP32[r9>>2];r34=(HEAPU8[r27]<<8|HEAPU8[r27+1|0])<<r32|HEAP32[r5];HEAP32[r5]=r34;HEAP32[r9>>2]=r27+2|0;r27=r32-16|0;HEAP32[r4]=r27;r35=r27;r36=r34}else{r35=r32;r36=HEAP32[r5]}r32=HEAP32[r2+(r36>>>31<<2)+24>>2];r34=r36<<1;HEAP32[r5]=r34;HEAP32[r4]=r35+1|0;r27=r2+40|0;r9=HEAP32[r27>>2];r26=HEAP32[r12];do{if((r34|0)<0){HEAP32[r5]=r36<<2;HEAP32[r4]=r35+2|0;r37=0}else{if(r34>>>0>201326591){r29=r36>>>27&15;r25=(HEAPU8[(r29<<1)+5252668|0]<<r26)+1|0;r10=HEAPU8[(r29<<1)+5252669|0];HEAP32[r4]=r10+(r35+(r26+2))|0;r29=r34<<r10;r10=r29>>31;r7=r29<<1;HEAP32[r5]=r7;if((r26|0)==0){r38=r25}else{r38=(r7>>>((32-r26|0)>>>0))+r25|0}HEAP32[r5]=r7<<r26;r37=(r38^r10)-r10|0;break}r10=r36>>>21&1023;r7=(HEAPU8[(r10<<1)+5252684|0]<<r26)+1|0;r25=HEAPU8[(r10<<1)+5252685|0];r10=r25+(r35+2)|0;HEAP32[r4]=r10;r29=r34<<r25;r25=r29>>31;r11=r29<<1;HEAP32[r5]=r11;if((r26|0)==0){r39=r7}else{if((r10|0)>0){r29=r1+8|0;r19=HEAP32[r29>>2];r16=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r10|r11;HEAP32[r5]=r16;HEAP32[r29>>2]=r19+2|0;r19=r10-16|0;HEAP32[r4]=r19;r40=r16;r41=r19}else{r40=r11;r41=r10}HEAP32[r5]=r40<<r26;HEAP32[r4]=r41+r26|0;r39=(r40>>>((32-r26|0)>>>0))+r7|0}r37=(r39^r25)-r25|0}}while(0);r39=27-HEAP32[r12]|0;r12=r37+r9<<r39>>r39;HEAP32[r27>>2]=r12;r27=HEAP32[r4];if((r27|0)>0){r39=r1+8|0;r9=HEAP32[r39>>2];r37=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r27|HEAP32[r5];HEAP32[r5]=r37;HEAP32[r39>>2]=r9+2|0;r9=r27-16|0;HEAP32[r4]=r9;r42=r9;r43=r37}else{r42=r27;r43=HEAP32[r5]}r27=r2+44|0;r2=HEAP32[r27>>2];r37=HEAP32[r8];do{if((r43|0)<0){HEAP32[r5]=r43<<1;HEAP32[r4]=r42+1|0;r44=0}else{if(r43>>>0>201326591){r9=r43>>>28;r39=(HEAPU8[(r9<<1)+5252668|0]<<r37)+1|0;r26=HEAPU8[(r9<<1)+5252669|0];HEAP32[r4]=r42+(r37+(r26+1))|0;r9=r43<<r26;r26=r9>>31;r40=r9<<1;HEAP32[r5]=r40;if((r37|0)==0){r45=r39}else{r45=(r40>>>((32-r37|0)>>>0))+r39|0}HEAP32[r5]=r40<<r37;r44=(r45^r26)-r26|0;break}r26=r43>>>22;r40=(HEAPU8[(r26<<1)+5252684|0]<<r37)+1|0;r39=HEAPU8[(r26<<1)+5252685|0];r26=r42+(r39+1)|0;HEAP32[r4]=r26;r9=r43<<r39;r39=r9>>31;r41=r9<<1;HEAP32[r5]=r41;if((r37|0)==0){r46=r40}else{if((r26|0)>0){r9=r1+8|0;r34=HEAP32[r9>>2];r35=(HEAPU8[r34]<<8|HEAPU8[r34+1|0])<<r26|r41;HEAP32[r5]=r35;HEAP32[r9>>2]=r34+2|0;r34=r26-16|0;HEAP32[r4]=r34;r47=r35;r48=r34}else{r47=r41;r48=r26}HEAP32[r5]=r47<<r37;HEAP32[r4]=r48+r37|0;r46=(r47>>>((32-r37|0)>>>0))+r40|0}r44=(r46^r39)-r39|0}}while(0);r46=27-HEAP32[r8]|0;r8=r44+r2<<r46>>r46;HEAP32[r27>>2]=r8;r27=HEAP32[r6];r46=(r27<<1)+r12|0;r12=(HEAP32[r13>>2]<<1)+r8+16|0;r8=HEAP32[r21>>2];if(r46>>>0>r8>>>0){r49=(r46|0)<0?0:r8}else{r49=r46}r46=HEAP32[r14>>2];if(r12>>>0<=r46>>>0){r50=r12;r51=r50<<1;r52=r51&2;r53=r49&1;r54=r52|r53;r55=r49>>>1;r56=r50>>>1;r57=HEAP32[r28];r58=Math.imul(r56,r57);r59=r58+r55|0;r60=(r54<<2)+r3|0,r61=r60>>2;r62=HEAP32[r61];r63=HEAP32[r33];r64=r57<<3;r65=r27+r64|0;r66=r63+r65|0;r67=HEAP32[r32>>2];r68=r67+r59|0;FUNCTION_TABLE[r62](r66,r68,r57,8);r69=HEAP32[r61];r70=HEAP32[r31];r71=HEAP32[r28];r72=r71<<3;r73=HEAP32[r6];r74=r72+r73|0;r75=r70+r74|0;r76=r32+4|0;r77=HEAP32[r76>>2];r78=r77+r59|0;FUNCTION_TABLE[r69](r75,r78,r71,8);r79=HEAP32[r61];r80=HEAP32[r30];r81=HEAP32[r28];r82=r81<<3;r83=HEAP32[r6];r84=r82+r83|0;r85=r80+r84|0;r86=r32+8|0;r87=HEAP32[r86>>2];r88=r87+r59|0;FUNCTION_TABLE[r79](r85,r88,r81,8);return}r50=(r12|0)<0?0:r46;r51=r50<<1;r52=r51&2;r53=r49&1;r54=r52|r53;r55=r49>>>1;r56=r50>>>1;r57=HEAP32[r28];r58=Math.imul(r56,r57);r59=r58+r55|0;r60=(r54<<2)+r3|0,r61=r60>>2;r62=HEAP32[r61];r63=HEAP32[r33];r64=r57<<3;r65=r27+r64|0;r66=r63+r65|0;r67=HEAP32[r32>>2];r68=r67+r59|0;FUNCTION_TABLE[r62](r66,r68,r57,8);r69=HEAP32[r61];r70=HEAP32[r31];r71=HEAP32[r28];r72=r71<<3;r73=HEAP32[r6];r74=r72+r73|0;r75=r70+r74|0;r76=r32+4|0;r77=HEAP32[r76>>2];r78=r77+r59|0;FUNCTION_TABLE[r69](r75,r78,r71,8);r79=HEAP32[r61];r80=HEAP32[r30];r81=HEAP32[r28];r82=r81<<3;r83=HEAP32[r6];r84=r82+r83|0;r85=r80+r84|0;r86=r32+8|0;r87=HEAP32[r86>>2];r88=r87+r59|0;FUNCTION_TABLE[r79](r85,r88,r81,8);return}function _motion_fi_dmv_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67;r3=r2>>2;r4=(r1+4|0)>>2;r5=HEAP32[r4];if((r5|0)>0){r6=r1+8|0;r7=HEAP32[r6>>2];r8=r1|0;r9=(HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<r5|HEAP32[r8>>2];HEAP32[r8>>2]=r9;HEAP32[r6>>2]=r7+2|0;r7=r5-16|0;HEAP32[r4]=r7;r10=r7;r11=r9}else{r10=r5;r11=HEAP32[r1>>2]}r5=r2+32|0;r9=HEAP32[r5>>2];r7=r2+48|0;r6=HEAP32[r7>>2];r8=(r1|0)>>2;do{if((r11|0)<0){HEAP32[r8]=r11<<1;HEAP32[r4]=r10+1|0;r12=0}else{if(r11>>>0>201326591){r13=r11>>>28;r14=(HEAPU8[(r13<<1)+5252668|0]<<r6)+1|0;r15=HEAPU8[(r13<<1)+5252669|0];HEAP32[r4]=r10+(r6+(r15+1))|0;r13=r11<<r15;r15=r13>>31;r16=r13<<1;HEAP32[r8]=r16;if((r6|0)==0){r17=r14}else{r17=(r16>>>((32-r6|0)>>>0))+r14|0}HEAP32[r8]=r16<<r6;r12=(r17^r15)-r15|0;break}r15=r11>>>22;r16=(HEAPU8[(r15<<1)+5252684|0]<<r6)+1|0;r14=HEAPU8[(r15<<1)+5252685|0];r15=r10+(r14+1)|0;HEAP32[r4]=r15;r13=r11<<r14;r14=r13>>31;r18=r13<<1;HEAP32[r8]=r18;if((r6|0)==0){r19=r16}else{if((r15|0)>0){r13=r1+8|0;r20=HEAP32[r13>>2];r21=(HEAPU8[r20]<<8|HEAPU8[r20+1|0])<<r15|r18;HEAP32[r8]=r21;HEAP32[r13>>2]=r20+2|0;r20=r15-16|0;HEAP32[r4]=r20;r22=r21;r23=r20}else{r22=r18;r23=r15}HEAP32[r8]=r22<<r6;HEAP32[r4]=r23+r6|0;r19=(r22>>>((32-r6|0)>>>0))+r16|0}r12=(r19^r14)-r14|0}}while(0);r19=27-HEAP32[r7>>2]|0;r7=r12+r9<<r19>>r19;HEAP32[r5>>2]=r7;HEAP32[r3+10]=r7;r5=HEAP32[r4];if((r5|0)>0){r19=r1+8|0;r9=HEAP32[r19>>2];r12=(HEAPU8[r9]<<8|HEAPU8[r9+1|0])<<r5|HEAP32[r8];HEAP32[r8]=r12;HEAP32[r19>>2]=r9+2|0;r9=r5-16|0;HEAP32[r4]=r9;r24=r9;r25=r12}else{r24=r5;r25=HEAP32[r8]}r5=r25>>>30;r12=HEAPU8[(r5<<1)+5253245|0];r9=r25<<r12;HEAP32[r8]=r9;r25=r24+r12|0;HEAP32[r4]=r25;r12=(HEAP8[(r5<<1)+5253244|0]<<24>>24)+(((r7|0)>0&1)+r7>>1)|0;r5=r2+36|0;r24=HEAP32[r5>>2];r19=r2+52|0;r6=HEAP32[r19>>2];do{if((r9|0)<0){HEAP32[r8]=r9<<1;HEAP32[r4]=r25+1|0;r26=0}else{if(r9>>>0>201326591){r22=r9>>>28;r23=(HEAPU8[(r22<<1)+5252668|0]<<r6)+1|0;r11=HEAPU8[(r22<<1)+5252669|0];HEAP32[r4]=r11+(r25+(r6+1))|0;r22=r9<<r11;r11=r22>>31;r10=r22<<1;HEAP32[r8]=r10;if((r6|0)==0){r27=r23}else{r27=(r10>>>((32-r6|0)>>>0))+r23|0}HEAP32[r8]=r10<<r6;r26=(r27^r11)-r11|0;break}r11=r9>>>22;r10=(HEAPU8[(r11<<1)+5252684|0]<<r6)+1|0;r23=HEAPU8[(r11<<1)+5252685|0];r11=r23+(r25+1)|0;HEAP32[r4]=r11;r22=r9<<r23;r23=r22>>31;r17=r22<<1;HEAP32[r8]=r17;if((r6|0)==0){r28=r10}else{if((r11|0)>0){r22=r1+8|0;r14=HEAP32[r22>>2];r16=(HEAPU8[r14]<<8|HEAPU8[r14+1|0])<<r11|r17;HEAP32[r8]=r16;HEAP32[r22>>2]=r14+2|0;r14=r11-16|0;HEAP32[r4]=r14;r29=r16;r30=r14}else{r29=r17;r30=r11}HEAP32[r8]=r29<<r6;HEAP32[r4]=r30+r6|0;r28=(r29>>>((32-r6|0)>>>0))+r10|0}r26=(r28^r23)-r23|0}}while(0);r28=27-HEAP32[r19>>2]|0;r19=r26+r24<<r28>>r28;HEAP32[r5>>2]=r19;HEAP32[r3+11]=r19;r5=HEAP32[r8];r28=r5>>>30;r24=HEAPU8[(r28<<1)+5253245|0];HEAP32[r8]=r5<<r24;HEAP32[r4]=HEAP32[r4]+r24|0;r24=HEAP8[(r28<<1)+5253244|0]<<24>>24;r28=HEAP32[r1+404>>2];r4=(r1+24|0)>>2;r5=HEAP32[r4];r8=(r5<<1)+r7|0;r7=r1+408|0;r26=(HEAP32[r7>>2]<<1)+r19|0;r6=r1+48|0;r29=HEAP32[r6>>2];if(r8>>>0>r29>>>0){r31=(r8|0)<0?0:r29}else{r31=r8}r8=r1+52|0;r29=HEAP32[r8>>2];if(r26>>>0>r29>>>0){r32=(r26|0)<0?0:r29}else{r32=r26}r26=(r1+28|0)>>2;r29=HEAP32[r26];r30=Math.imul(r32>>>1,r29)+(r31>>>1)|0;r9=(((r32<<1&2|r31&1)<<2)+5243300|0)>>2;r31=(r1+12|0)>>2;FUNCTION_TABLE[HEAP32[r9]](HEAP32[r31]+r5|0,HEAP32[r3]+r30|0,r29,16);r29=(r1+16|0)>>2;FUNCTION_TABLE[HEAP32[r9]](HEAP32[r29]+HEAP32[r4]|0,HEAP32[r3+1]+r30|0,HEAP32[r26],16);r5=(r1+20|0)>>2;FUNCTION_TABLE[HEAP32[r9]](HEAP32[r5]+HEAP32[r4]|0,HEAP32[r3+2]+r30|0,HEAP32[r26],16);r30=HEAP32[r4];r3=(r30<<1)+r12|0;r12=(((r19|0)>0&1)+r19>>1)+(HEAP32[r7>>2]<<1)+r28+r24|0;r24=HEAP32[r6>>2];if(r3>>>0>r24>>>0){r33=(r3|0)<0?0:r24}else{r33=r3}r3=HEAP32[r8>>2];if(r12>>>0<=r3>>>0){r34=r12;r35=r34<<1;r36=r35&2;r37=r33&1;r38=r36|r37;r39=r33>>>1;r40=r34>>>1;r41=HEAP32[r26];r42=Math.imul(r40,r41);r43=r42+r39|0;r44=(r38<<2)+5243332|0,r45=r44>>2;r46=HEAP32[r45];r47=HEAP32[r31];r48=r47+r30|0;r49=r2+12|0;r50=HEAP32[r49>>2];r51=r50+r43|0;FUNCTION_TABLE[r46](r48,r51,r41,16);r52=HEAP32[r45];r53=HEAP32[r29];r54=HEAP32[r26];r55=HEAP32[r4];r56=r53+r55|0;r57=r2+16|0;r58=HEAP32[r57>>2];r59=r58+r43|0;FUNCTION_TABLE[r52](r56,r59,r54,16);r60=HEAP32[r45];r61=HEAP32[r5];r62=HEAP32[r26];r63=HEAP32[r4];r64=r61+r63|0;r65=r2+20|0;r66=HEAP32[r65>>2];r67=r66+r43|0;FUNCTION_TABLE[r60](r64,r67,r62,16);return}r34=(r12|0)<0?0:r3;r35=r34<<1;r36=r35&2;r37=r33&1;r38=r36|r37;r39=r33>>>1;r40=r34>>>1;r41=HEAP32[r26];r42=Math.imul(r40,r41);r43=r42+r39|0;r44=(r38<<2)+5243332|0,r45=r44>>2;r46=HEAP32[r45];r47=HEAP32[r31];r48=r47+r30|0;r49=r2+12|0;r50=HEAP32[r49>>2];r51=r50+r43|0;FUNCTION_TABLE[r46](r48,r51,r41,16);r52=HEAP32[r45];r53=HEAP32[r29];r54=HEAP32[r26];r55=HEAP32[r4];r56=r53+r55|0;r57=r2+16|0;r58=HEAP32[r57>>2];r59=r58+r43|0;FUNCTION_TABLE[r52](r56,r59,r54,16);r60=HEAP32[r45];r61=HEAP32[r5];r62=HEAP32[r26];r63=HEAP32[r4];r64=r61+r63|0;r65=r2+20|0;r66=HEAP32[r65>>2];r67=r66+r43|0;FUNCTION_TABLE[r60](r64,r67,r62,16);return}function _mpeg2_slice(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+4|0;r7=r6;r8=HEAPU8[r3];r9=HEAPU8[r3+1|0]<<16|r8<<24|HEAPU8[r3+2|0]<<8|HEAPU8[r3+3|0];r10=(r1|0)>>2;HEAP32[r10]=r9;r11=r3+4|0;r3=(r1+8|0)>>2;HEAP32[r3]=r11;r12=(r1+4|0)>>2;HEAP32[r12]=-16;r13=(r1+200|0)>>1;HEAP16[r13]=16384;r14=(r1+198|0)>>1;HEAP16[r14]=16384;r15=(r1+196|0)>>1;HEAP16[r15]=16384;r16=r1+120|0;r17=(r1+156|0)>>2;r18=r1+152|0,r19=r18>>2;r20=r1+164|0;r21=r1+160|0;r22=r1+64|0;r23=r1+96|0;r24=r23>>2;HEAP32[r24]=0;HEAP32[r24+1]=0;HEAP32[r24+2]=0;HEAP32[r24+3]=0;r24=r18>>2;HEAP32[r24]=0;HEAP32[r24+1]=0;HEAP32[r24+2]=0;HEAP32[r24+3]=0;if((HEAP32[r4+4207]|0)==0){r25=r2;r26=r9;r27=-11}else{r24=r9<<3;HEAP32[r10]=r24;HEAP32[r12]=-13;r25=(r8>>>5<<7)+r2|0;r26=r24;r27=-8}r24=r25-1|0;r25=r24<<4;r2=(r1+408|0)>>2;HEAP32[r2]=r25;r8=(r1+396|0)>>2;r9=(HEAP32[r8]|0)==0;do{if(r9){r5=1565}else{if((HEAP32[r4+4209]|0)==3){r28=0;break}else{r5=1565;break}}}while(0);if(r5==1565){r28=Math.imul(HEAP32[r4+9],r24)}r24=HEAP32[r4+96]+r28|0;r29=r1+12|0,r30=r29>>2;HEAP32[r30]=r24;r31=(r1+16832|0)>>2;r32=r28>>2-HEAP32[r31];r28=HEAP32[r4+97]+r32|0;r33=(r1+16|0)>>2;HEAP32[r33]=r28;r34=HEAP32[r4+98]+r32|0;r32=(r1+20|0)>>2;HEAP32[r32]=r34;r35=r26>>>27;r36=r26<<5;HEAP32[r10]=r36;HEAP32[r12]=r27;r26=(r1+412|0)>>2;HEAP32[r26]=(r35<<7)+r1+436|0;r37=(r1+416|0)>>2;HEAP32[r37]=(r35<<7)+r1+4532|0;r38=r1+428|0;r39=(r1+420|0)>>2;HEAP32[r39]=(r35<<7)+HEAP32[r38>>2]|0;r40=r1+432|0;r41=(r1+424|0)>>2;HEAP32[r41]=(r35<<7)+HEAP32[r40>>2]|0;L2139:do{if((r36|0)<0){r35=r36;r42=r11;r43=r27;while(1){r44=r35<<9;HEAP32[r10]=r44;r45=r43+9|0;HEAP32[r12]=r45;if((r45|0)>0){r46=(HEAPU8[r42]<<8|HEAPU8[r42+1|0])<<r45|r44;HEAP32[r10]=r46;r47=r42+2|0;HEAP32[r3]=r47;r48=r43-7|0;HEAP32[r12]=r48;r49=r48;r50=r47;r51=r46}else{r49=r45;r50=r42;r51=r44}if((r51|0)<0){r35=r51;r42=r50;r43=r49}else{r52=r51;r53=r49;r54=r50;break L2139}}}else{r52=r36;r53=r27;r54=r11}}while(0);L2146:do{if(r52>>>0>134217727){r55=0;r56=r52;r57=r53;r5=1572}else{r11=0;r27=r52;r36=r53;r50=r54;L2147:while(1){r58=r27>>>20;if(r27>>>0>25165823){r5=1574;break}do{if((r58|0)==8){r49=r11+33|0;r51=r27<<11;HEAP32[r10]=r51;r43=r36+11|0;HEAP32[r12]=r43;if((r43|0)<=0){r59=r49;r60=r43;r61=r50;r62=r51;break}r42=(HEAPU8[r50]<<8|HEAPU8[r50+1|0])<<r43|r51;HEAP32[r10]=r42;r51=r50+2|0;HEAP32[r3]=r51;r43=r36-5|0;HEAP32[r12]=r43;r59=r49;r60=r43;r61=r51;r62=r42}else if((r58|0)==15){r42=r27<<11&2147481600;HEAP32[r10]=r42;r51=r36+11|0;HEAP32[r12]=r51;if((r51|0)<=0){r59=r11;r60=r51;r61=r50;r62=r42;break}r43=(HEAPU8[r50]<<8|HEAPU8[r50+1|0])<<r51|r42;HEAP32[r10]=r43;r42=r50+2|0;HEAP32[r3]=r42;r51=r36-5|0;HEAP32[r12]=r51;r59=r11;r60=r51;r61=r42;r62=r43}else{r5=2172;break L2147}}while(0);if(r62>>>0>134217727){r55=r59;r56=r62;r57=r60;r5=1572;break L2146}else{r11=r59;r27=r62;r36=r60;r50=r61}}if(r5==1574){r63=(r58-24<<1)+5253036|0;r64=r11;r65=r27;r66=r36;break}else if(r5==2172){STACKTOP=r6;return}}}while(0);if(r5==1572){r63=((r56>>>26)-2<<1)+5252976|0;r64=r55;r65=r56;r66=r57}r57=HEAPU8[r63+1|0]+1|0;HEAP32[r10]=r65<<r57;HEAP32[r12]=r57+r66|0;r66=HEAPU8[r63|0]+r64<<4;r64=(r1+24|0)>>2;HEAP32[r64]=r66;r63=(r1+16820|0)>>2;r57=HEAP32[r63];r65=r66-r57|0;if((r65|0)>-1){r66=r1+36|0;r56=r1+40|0;r55=r1+16836|0;L2164:do{if(r9){r58=r65;r61=r25;r60=r24;r62=r28;r59=r34;while(1){r54=r60+HEAP32[r66>>2]|0;HEAP32[r30]=r54;r53=HEAP32[r56>>2];r52=r62+r53|0;HEAP32[r33]=r52;r50=r59+r53|0;HEAP32[r32]=r50;r53=r61+16|0;r43=r58-r57|0;if((r43|0)>-1){r58=r43;r61=r53;r60=r54;r62=r52;r59=r50}else{r67=r58;r68=r53;break L2164}}}else{r58=r65;r59=r25;r62=r24;r60=r28;r61=r34;while(1){if((HEAP32[r55>>2]|0)==3){r69=r62;r70=r60;r71=r61}else{r36=r62+HEAP32[r66>>2]|0;HEAP32[r30]=r36;r27=HEAP32[r56>>2];r11=r60+r27|0;HEAP32[r33]=r11;r53=r61+r27|0;HEAP32[r32]=r53;r69=r36;r70=r11;r71=r53}r53=r59+16|0;r11=r58-r57|0;if((r11|0)>-1){r58=r11;r59=r53;r62=r69;r60=r70;r61=r71}else{r67=r58;r68=r53;break L2164}}}}while(0);HEAP32[r64]=r67;HEAP32[r2]=r68;r72=r68}else{r72=r25}r25=(r1+60|0)>>2;if(r72>>>0>HEAP32[r25]>>>0){STACKTOP=r6;return}r72=HEAP32[1310868];if((r72|0)!=0){FUNCTION_TABLE[r72](r7)}r72=(r1+16836|0)>>2;r68=(r1+36|0)>>2;r67=(r1+40|0)>>2;r71=(r1+400|0)>>2;r70=(r1+192|0)>>2;r69=r1+176|0;r57=(r1+16848|0)>>2;r56=(r1+16844|0)>>2;r66=r1+28|0;r55=(r1+32|0)>>2;r34=(r1+16872|0)>>2;r28=r1+256|0,r24=r28>>1;r65=r1+16852|0;r9=(r1+16840|0)>>2;r58=(r1+16856|0)>>2;r61=r1+168|0;r60=r1+172|0;L2180:while(1){r62=HEAP32[r12];if((r62|0)>0){r59=HEAP32[r3];HEAP32[r10]=(HEAPU8[r59]<<8|HEAPU8[r59+1|0])<<r62|HEAP32[r10];HEAP32[r3]=r59+2|0;r59=r62-16|0;HEAP32[r12]=r59;r73=r59}else{r73=r62}r62=HEAP32[r72];do{if((r62|0)==4){r59=HEAP32[r10]<<1;HEAP32[r10]=r59;r53=r73+1|0;HEAP32[r12]=r53;r74=1;r75=r53;r76=r59;r5=1620;break}else if((r62|0)==1){r59=HEAP32[r10];r53=r59>>>31;r11=HEAPU8[(r53<<1)+5252845|0];r36=r59<<r11;HEAP32[r10]=r36;r59=r73+r11|0;HEAP32[r12]=r59;r11=HEAPU8[(r53<<1)+5252844|0];if((HEAP32[r57]|0)!=0){r77=r11;r78=r36;r79=r59;r5=1617;break}if((HEAP32[r56]|0)!=3){r77=r11;r78=r36;r79=r59;r5=1617;break}r53=r36<<1;HEAP32[r10]=r53;r27=r59+1|0;HEAP32[r12]=r27;r77=r36>>>31<<5|r11;r78=r53;r79=r27;r5=1617;break}else if((r62|0)==3){r27=HEAP32[r10];r53=r27>>>26;r11=HEAPU8[(r53<<1)+5252849|0];r36=r27<<r11;HEAP32[r10]=r36;r27=r73+r11|0;HEAP32[r12]=r27;r11=HEAPU8[(r53<<1)+5252848|0];if((HEAP32[r56]|0)!=3){if((r11&1|0)!=0){r77=r11;r78=r36;r79=r27;r5=1617;break}r53=r36<<2;HEAP32[r10]=r53;r59=r27+2|0;HEAP32[r12]=r59;r77=r36>>>30<<6|r11;r78=r53;r79=r59;r5=1617;break}if((HEAP32[r57]|0)!=0){r77=r11|128;r78=r36;r79=r27;r5=1617;break}if((r11&1|0)==0){r59=r36>>>30<<6|r11;r53=r36<<2;HEAP32[r10]=r53;r50=r27+2|0;HEAP32[r12]=r50;if((r11&3|0)==0){r77=r59;r78=r53;r79=r50;r5=1617;break}else{r80=r59;r81=r53;r82=r50}}else{r80=r11;r81=r36;r82=r27}r27=r81<<1;HEAP32[r10]=r27;r36=r82+1|0;HEAP32[r12]=r36;r77=r81>>>31<<5|r80;r78=r27;r79=r36;r5=1617;break}else if((r62|0)==2){r36=HEAP32[r10];r27=r36>>>27;r11=HEAPU8[(r27<<1)+5252781|0];r50=r36<<r11;HEAP32[r10]=r50;r36=r73+r11|0;HEAP32[r12]=r36;r11=HEAPU8[(r27<<1)+5252780|0];if((HEAP32[r56]|0)!=3){if((r11&8|0)==0){r83=r11;r84=r50;r85=r36}else{r27=r50<<2;HEAP32[r10]=r27;r53=r36+2|0;HEAP32[r12]=r53;r83=r50>>>30<<6|r11;r84=r27;r85=r53}r77=r83|8;r78=r84;r79=r85;r5=1617;break}r53=(r11&8|0)!=0;if((HEAP32[r57]|0)!=0){r77=(r53?r11|128:r11)|8;r78=r50;r79=r36;r5=1617;break}if(r53){r53=r50<<2;HEAP32[r10]=r53;r27=r36+2|0;HEAP32[r12]=r27;r86=r50>>>30<<6|r11;r87=r53;r88=r27}else{r86=r11;r87=r50;r88=r36}if((r86&3|0)==0){r89=r86;r90=r87;r91=r88}else{r36=r87<<1;HEAP32[r10]=r36;r50=r88+1|0;HEAP32[r12]=r50;r89=r87>>>31<<5|r86;r90=r36;r91=r50}r77=r89|8;r78=r90;r79=r91;r5=1617;break}else{r92=0;r5=2115}}while(0);do{if(r5==1617){r5=0;if((r77&16|0)==0){r93=r79;r94=r78}else{r50=r78>>>27;r36=r78<<5;HEAP32[r10]=r36;r11=r79+5|0;HEAP32[r12]=r11;HEAP32[r26]=(r50<<7)+r1+436|0;HEAP32[r37]=(r50<<7)+r1+4532|0;HEAP32[r39]=(r50<<7)+HEAP32[r38>>2]|0;HEAP32[r41]=(r50<<7)+HEAP32[r40>>2]|0;r93=r11;r94=r36}if((r77&1|0)!=0){r74=r77;r75=r93;r76=r94;r5=1620;break}r36=HEAP32[((r77>>6<<2)+176>>2)+r4];if((r77&8|0)==0){r95=5243300}else{FUNCTION_TABLE[r36](r1,r16,5243300);r95=5243332}if((r77&4|0)!=0){FUNCTION_TABLE[r36](r1,r22,r95)}if((r77&2|0)==0){r92=r77;r5=2115;break}r36=r77&32;r11=HEAP32[r66>>2];r50=(r36|0)==0?r11<<3:r11;r27=r11<<(r36>>>5);r36=HEAP32[r12];if((r36|0)>0){r11=HEAP32[r3];r53=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r36|HEAP32[r10];HEAP32[r10]=r53;HEAP32[r3]=r11+2|0;r11=r36-16|0;HEAP32[r12]=r11;r96=r11;r97=r53}else{r96=r36;r97=HEAP32[r10]}if(r97>>>0>536870911){r36=(r97>>>25)-16|0;r53=HEAPU8[(r36<<1)+5255037|0];r11=r97<<r53;HEAP32[r10]=r11;r59=r96+r53|0;HEAP32[r12]=r59;r98=(r36<<1)+5255036|0;r99=r11;r100=r59}else{r59=r97>>>23;r11=HEAPU8[(r59<<1)+5254909|0];r36=r97<<r11;HEAP32[r10]=r36;r53=r96+r11|0;HEAP32[r12]=r53;r98=(r59<<1)+5254908|0;r99=r36;r100=r53}r53=HEAPU8[r98];r36=HEAP32[r31];if((r36|0)==0){r59=HEAP32[r64];r11=HEAP32[r30];r52=r11+r59|0;if((r53&1|0)!=0){if((HEAP32[r34]|0)==0){r101=_get_non_intra_block(r1,HEAP32[r37])}else{r101=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r101,r28,r52,r27)}if((r53&2|0)!=0){if((HEAP32[r34]|0)==0){r102=_get_non_intra_block(r1,HEAP32[r37])}else{r102=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r102,r28,r59+(r11+8)|0,r27)}if((r53&4|0)!=0){if((HEAP32[r34]|0)==0){r103=_get_non_intra_block(r1,HEAP32[r37])}else{r103=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r103,r28,r11+r59+r50|0,r27)}if((r53&8|0)!=0){if((HEAP32[r34]|0)==0){r104=_get_non_intra_block(r1,HEAP32[r37])}else{r104=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r104,r28,r59+(r11+(r50+8))|0,r27)}if((r53&16|0)!=0){r11=(r59>>1)+HEAP32[r33]|0;r52=HEAP32[r55];if((HEAP32[r34]|0)==0){r105=_get_non_intra_block(r1,HEAP32[r41])}else{r105=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r105,r28,r11,r52)}if((r53&32|0)==0){r92=r77;r5=2115;break}r52=(r59>>1)+HEAP32[r32]|0;r59=HEAP32[r55];if((HEAP32[r34]|0)==0){r106=_get_non_intra_block(r1,HEAP32[r41])}else{r106=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r106,r28,r52,r59);r92=r77;r5=2115;break}else if((r36|0)==1){HEAP32[r10]=r99<<2;HEAP32[r12]=r100+2|0;r36=HEAP32[r64],r59=r36>>1;r52=HEAP32[r30];r11=r52+r36|0;if((r53&1|0)!=0){if((HEAP32[r34]|0)==0){r107=_get_non_intra_block(r1,HEAP32[r37])}else{r107=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r107,r28,r11,r27)}if((r53&2|0)!=0){if((HEAP32[r34]|0)==0){r108=_get_non_intra_block(r1,HEAP32[r37])}else{r108=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r108,r28,r36+(r52+8)|0,r27)}if((r53&4|0)!=0){if((HEAP32[r34]|0)==0){r109=_get_non_intra_block(r1,HEAP32[r37])}else{r109=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r109,r28,r52+r36+r50|0,r27)}if((r53&8|0)!=0){if((HEAP32[r34]|0)==0){r110=_get_non_intra_block(r1,HEAP32[r37])}else{r110=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r110,r28,r36+(r52+(r50+8))|0,r27)}r52=r27>>1;r36=(r50>>1)+r59;if((r53&16|0)!=0){r11=HEAP32[r33]+r59|0;if((HEAP32[r34]|0)==0){r111=_get_non_intra_block(r1,HEAP32[r41])}else{r111=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r111,r28,r11,r52)}if((r53&32|0)!=0){r11=HEAP32[r32]+r59|0;if((HEAP32[r34]|0)==0){r112=_get_non_intra_block(r1,HEAP32[r41])}else{r112=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r112,r28,r11,r52)}if((r99|0)<0){r11=HEAP32[r33]+r36|0;if((HEAP32[r34]|0)==0){r113=_get_non_intra_block(r1,HEAP32[r41])}else{r113=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r113,r28,r11,r52)}if((r99&1073741824|0)==0){r92=r77;r5=2115;break}r11=HEAP32[r32]+r36|0;if((HEAP32[r34]|0)==0){r114=_get_non_intra_block(r1,HEAP32[r41])}else{r114=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r114,r28,r11,r52);r92=r77;r5=2115;break}else{HEAP32[r10]=r99<<6;HEAP32[r12]=r100+6|0;r52=HEAP32[r64];r11=HEAP32[r30];r36=r11+r52|0;r59=HEAP32[r33];r54=r59+r52|0;r43=HEAP32[r32];r42=r43+r52|0;if((r53&1|0)!=0){if((HEAP32[r34]|0)==0){r115=_get_non_intra_block(r1,HEAP32[r37])}else{r115=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r115,r28,r36,r27)}if((r53&2|0)!=0){if((HEAP32[r34]|0)==0){r116=_get_non_intra_block(r1,HEAP32[r37])}else{r116=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r116,r28,r52+(r11+8)|0,r27)}if((r53&4|0)!=0){if((HEAP32[r34]|0)==0){r117=_get_non_intra_block(r1,HEAP32[r37])}else{r117=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r117,r28,r11+r52+r50|0,r27)}if((r53&8|0)!=0){if((HEAP32[r34]|0)==0){r118=_get_non_intra_block(r1,HEAP32[r37])}else{r118=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r118,r28,r52+(r11+(r50+8))|0,r27)}if((r53&16|0)!=0){if((HEAP32[r34]|0)==0){r119=_get_non_intra_block(r1,HEAP32[r41])}else{r119=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r119,r28,r54,r27)}if((r53&32|0)!=0){if((HEAP32[r34]|0)==0){r120=_get_non_intra_block(r1,HEAP32[r41])}else{r120=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r120,r28,r42,r27)}if((r99|0)<0){if((HEAP32[r34]|0)==0){r121=_get_non_intra_block(r1,HEAP32[r41])}else{r121=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r121,r28,r59+r52+r50|0,r27)}if((r99&1073741824|0)!=0){if((HEAP32[r34]|0)==0){r122=_get_non_intra_block(r1,HEAP32[r41])}else{r122=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r122,r28,r43+r52+r50|0,r27)}if((r99&536870912|0)!=0){if((HEAP32[r34]|0)==0){r123=_get_non_intra_block(r1,HEAP32[r41])}else{r123=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r123,r28,r52+(r59+8)|0,r27)}if((r99&268435456|0)!=0){if((HEAP32[r34]|0)==0){r124=_get_non_intra_block(r1,HEAP32[r41])}else{r124=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r124,r28,r52+(r43+8)|0,r27)}if((r99&134217728|0)!=0){if((HEAP32[r34]|0)==0){r125=_get_non_intra_block(r1,HEAP32[r41])}else{r125=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r125,r28,r52+(r59+(r50+8))|0,r27)}if((r99&67108864|0)==0){r92=r77;r5=2115;break}if((HEAP32[r34]|0)==0){r126=_get_non_intra_block(r1,HEAP32[r41])}else{r126=_get_mpeg1_non_intra_block(r1)}FUNCTION_TABLE[HEAP32[1310842]](r126,r28,r52+(r43+(r50+8))|0,r27);r92=r77;r5=2115;break}}}while(0);do{if(r5==1620){r5=0;do{if((HEAP32[r65>>2]|0)==0){r27=r23>>2;HEAP32[r27]=0;HEAP32[r27+1]=0;HEAP32[r27+2]=0;HEAP32[r27+3]=0;r27=r18>>2;HEAP32[r27]=0;HEAP32[r27+1]=0;HEAP32[r27+2]=0;HEAP32[r27+3]=0;r127=r75;r128=r76}else{r27=(r75|0)>0;if((HEAP32[r56]|0)==3){if(r27){r50=HEAP32[r3];r43=(HEAPU8[r50]<<8|HEAPU8[r50+1|0])<<r75|r76;HEAP32[r10]=r43;HEAP32[r3]=r50+2|0;r50=r75-16|0;HEAP32[r12]=r50;r129=r50;r130=r43}else{r129=r75;r130=r76}r43=HEAP32[r19];r50=HEAP32[r61>>2];do{if((r130|0)<0){r52=r130<<1;HEAP32[r10]=r52;r59=r129+1|0;HEAP32[r12]=r59;r131=0;r132=r59;r133=r52}else{if(r130>>>0>201326591){r52=r130>>>28;r59=(HEAPU8[(r52<<1)+5252668|0]<<r50)+1|0;r42=HEAPU8[(r52<<1)+5252669|0];r52=r42+(r129+(r50+1))|0;HEAP32[r12]=r52;r53=r130<<r42;r42=r53>>31;r54=r53<<1;HEAP32[r10]=r54;if((r50|0)==0){r134=r59}else{r134=(r54>>>((32-r50|0)>>>0))+r59|0}r59=r54<<r50;HEAP32[r10]=r59;r131=(r134^r42)-r42|0;r132=r52;r133=r59;break}r59=r130>>>22;r52=(HEAPU8[(r59<<1)+5252684|0]<<r50)+1|0;r42=HEAPU8[(r59<<1)+5252685|0];r59=r42+(r129+1)|0;HEAP32[r12]=r59;r54=r130<<r42;r42=r54>>31;r53=r54<<1;HEAP32[r10]=r53;if((r50|0)==0){r135=r52;r136=r59;r137=r53}else{if((r59|0)>0){r54=HEAP32[r3];r11=(HEAPU8[r54]<<8|HEAPU8[r54+1|0])<<r59|r53;HEAP32[r10]=r11;HEAP32[r3]=r54+2|0;r54=r59-16|0;HEAP32[r12]=r54;r138=r11;r139=r54}else{r138=r53;r139=r59}r59=r138<<r50;HEAP32[r10]=r59;r53=r139+r50|0;HEAP32[r12]=r53;r135=(r138>>>((32-r50|0)>>>0))+r52|0;r136=r53;r137=r59}r131=(r135^r42)-r42|0;r132=r136;r133=r137}}while(0);r42=27-r50|0;r59=r131+r43<<r42>>r42;HEAP32[r19]=r59;HEAP32[r21>>2]=r59;if((r132|0)>0){r59=HEAP32[r3];r42=(HEAPU8[r59]<<8|HEAPU8[r59+1|0])<<r132|r133;HEAP32[r10]=r42;HEAP32[r3]=r59+2|0;r59=r132-16|0;HEAP32[r12]=r59;r140=r42;r141=r59}else{r140=r133;r141=r132}r59=HEAP32[r17];r42=HEAP32[r60>>2];do{if((r140|0)<0){r53=r140<<1;HEAP32[r10]=r53;r52=r141+1|0;HEAP32[r12]=r52;r142=0;r143=r53;r144=r52}else{if(r140>>>0>201326591){r52=r140>>>28;r53=(HEAPU8[(r52<<1)+5252668|0]<<r42)+1|0;r54=HEAPU8[(r52<<1)+5252669|0];r52=r54+(r141+(r42+1))|0;HEAP32[r12]=r52;r11=r140<<r54;r54=r11>>31;r36=r11<<1;HEAP32[r10]=r36;if((r42|0)==0){r145=r53}else{r145=(r36>>>((32-r42|0)>>>0))+r53|0}r53=r36<<r42;HEAP32[r10]=r53;r142=(r145^r54)-r54|0;r143=r53;r144=r52;break}r52=r140>>>22;r53=(HEAPU8[(r52<<1)+5252684|0]<<r42)+1|0;r54=HEAPU8[(r52<<1)+5252685|0];r52=r54+(r141+1)|0;HEAP32[r12]=r52;r36=r140<<r54;r54=r36>>31;r11=r36<<1;HEAP32[r10]=r11;if((r42|0)==0){r146=r53;r147=r11;r148=r52}else{if((r52|0)>0){r36=HEAP32[r3];r51=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r52|r11;HEAP32[r10]=r51;HEAP32[r3]=r36+2|0;r36=r52-16|0;HEAP32[r12]=r36;r149=r51;r150=r36}else{r149=r11;r150=r52}r52=r149<<r42;HEAP32[r10]=r52;r11=r150+r42|0;HEAP32[r12]=r11;r146=(r149>>>((32-r42|0)>>>0))+r53|0;r147=r52;r148=r11}r142=(r146^r54)-r54|0;r143=r147;r144=r148}}while(0);r43=27-r42|0;r50=r142+r59<<r43>>r43;HEAP32[r17]=r50;HEAP32[r20>>2]=r50;r50=r143<<1;HEAP32[r10]=r50;r43=r144+1|0;HEAP32[r12]=r43;r127=r43;r128=r50;break}else{if(r27){r50=HEAP32[r3];r43=(HEAPU8[r50]<<8|HEAPU8[r50+1|0])<<r75|r76;HEAP32[r10]=r43;HEAP32[r3]=r50+2|0;r50=r75-16|0;HEAP32[r12]=r50;r151=r50;r152=r43}else{r151=r75;r152=r76}r43=r152<<1;HEAP32[r10]=r43;HEAP32[r12]=r151+1|0;r50=HEAP32[r19];r54=HEAP32[r61>>2];do{if((r43|0)<0){r11=r152<<2;HEAP32[r10]=r11;r52=r151+2|0;HEAP32[r12]=r52;r153=0;r154=r52;r155=r11}else{if(r43>>>0>201326591){r11=r152>>>27&15;r52=(HEAPU8[(r11<<1)+5252668|0]<<r54)+1|0;r53=HEAPU8[(r11<<1)+5252669|0];r11=r53+(r151+(r54+2))|0;HEAP32[r12]=r11;r36=r43<<r53;r53=r36>>31;r51=r36<<1;HEAP32[r10]=r51;if((r54|0)==0){r156=r52}else{r156=(r51>>>((32-r54|0)>>>0))+r52|0}r52=r51<<r54;HEAP32[r10]=r52;r153=(r156^r53)-r53|0;r154=r11;r155=r52;break}r52=r152>>>21&1023;r11=(HEAPU8[(r52<<1)+5252684|0]<<r54)+1|0;r53=HEAPU8[(r52<<1)+5252685|0];r52=r53+(r151+2)|0;HEAP32[r12]=r52;r51=r43<<r53;r53=r51>>31;r36=r51<<1;HEAP32[r10]=r36;if((r54|0)==0){r157=r11;r158=r52;r159=r36}else{if((r52|0)>0){r51=HEAP32[r3];r49=(HEAPU8[r51]<<8|HEAPU8[r51+1|0])<<r52|r36;HEAP32[r10]=r49;HEAP32[r3]=r51+2|0;r51=r52-16|0;HEAP32[r12]=r51;r160=r49;r161=r51}else{r160=r36;r161=r52}r52=r160<<r54;HEAP32[r10]=r52;r36=r161+r54|0;HEAP32[r12]=r36;r157=(r160>>>((32-r54|0)>>>0))+r11|0;r158=r36;r159=r52}r153=(r157^r53)-r53|0;r154=r158;r155=r159}}while(0);r43=27-r54|0;r27=r153+r50<<r43>>r43;HEAP32[r19]=r27;HEAP32[r21>>2]=r27;if((r154|0)>0){r27=HEAP32[r3];r43=(HEAPU8[r27]<<8|HEAPU8[r27+1|0])<<r154|r155;HEAP32[r10]=r43;HEAP32[r3]=r27+2|0;r27=r154-16|0;HEAP32[r12]=r27;r162=r43;r163=r27}else{r162=r155;r163=r154}r27=HEAP32[r17];r43=HEAP32[r60>>2];do{if((r162|0)<0){r59=r162<<1;HEAP32[r10]=r59;r42=r163+1|0;HEAP32[r12]=r42;r164=0;r165=r59;r166=r42}else{if(r162>>>0>201326591){r42=r162>>>28;r59=(HEAPU8[(r42<<1)+5252668|0]<<r43)+1|0;r53=HEAPU8[(r42<<1)+5252669|0];r42=r53+(r163+(r43+1))|0;HEAP32[r12]=r42;r52=r162<<r53;r53=r52>>31;r36=r52<<1;HEAP32[r10]=r36;if((r43|0)==0){r167=r59}else{r167=(r36>>>((32-r43|0)>>>0))+r59|0}r59=r36<<r43;HEAP32[r10]=r59;r164=(r167^r53)-r53|0;r165=r59;r166=r42;break}r42=r162>>>22;r59=(HEAPU8[(r42<<1)+5252684|0]<<r43)+1|0;r53=HEAPU8[(r42<<1)+5252685|0];r42=r53+(r163+1)|0;HEAP32[r12]=r42;r36=r162<<r53;r53=r36>>31;r52=r36<<1;HEAP32[r10]=r52;if((r43|0)==0){r168=r59;r169=r52;r170=r42}else{if((r42|0)>0){r36=HEAP32[r3];r11=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r42|r52;HEAP32[r10]=r11;HEAP32[r3]=r36+2|0;r36=r42-16|0;HEAP32[r12]=r36;r171=r11;r172=r36}else{r171=r52;r172=r42}r42=r171<<r43;HEAP32[r10]=r42;r52=r172+r43|0;HEAP32[r12]=r52;r168=(r171>>>((32-r43|0)>>>0))+r59|0;r169=r42;r170=r52}r164=(r168^r53)-r53|0;r165=r169;r166=r170}}while(0);r50=27-r43|0;r54=r164+r27<<r50>>r50;HEAP32[r17]=r54;HEAP32[r20>>2]=r54;r54=r165<<1;HEAP32[r10]=r54;r50=r166+1|0;HEAP32[r12]=r50;r127=r50;r128=r54;break}}}while(0);r54=r74&32;r50=HEAP32[r66>>2];r53=(r54|0)==0?r50<<3:r50;r52=r50<<(r54>>>5);r54=HEAP32[r64];r50=HEAP32[r30];r42=r50+r54|0;if((r127|0)>0){r59=HEAP32[r3];r36=(HEAPU8[r59]<<8|HEAPU8[r59+1|0])<<r127|r128;HEAP32[r10]=r36;HEAP32[r3]=r59+2|0;r59=r127-16|0;HEAP32[r12]=r59;r173=r36;r174=r59}else{r173=r128;r174=r127}do{if(r173>>>0<4160749568){r59=r173>>>27;r36=HEAPU8[(r59<<1)+5253252|0];if((r59-16|0)>>>0<4){HEAP32[r10]=r173<<3;HEAP32[r12]=r174+3|0;r175=0;break}else{r11=HEAPU8[(r59<<1)+5253253|0];HEAP32[r12]=r11+r36+r174|0;r59=r173<<r11;r11=32-r36|0;HEAP32[r10]=r59<<r36;r175=(r59>>>(r11>>>0))-((r59^-2147483648)>>31>>>(r11>>>0))<<HEAP32[r9];break}}else{r11=(r173>>>23)-480|0;r59=HEAPU8[(r11<<1)+5253316|0];r36=HEAPU8[(r11<<1)+5253317|0];r11=r173<<r36;HEAP32[r10]=r11;r51=r174+r36|0;HEAP32[r12]=r51;if((r51|0)>0){r36=HEAP32[r3];r49=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r51|r11;HEAP32[r10]=r49;HEAP32[r3]=r36+2|0;r36=r51-16|0;HEAP32[r12]=r36;r176=r49;r177=r36}else{r176=r11;r177=r51}r51=32-r59|0;HEAP32[r10]=r176<<r59;HEAP32[r12]=r177+r59|0;r175=(r176>>>(r51>>>0))-((r176^-2147483648)>>31>>>(r51>>>0))<<HEAP32[r9]}}while(0);r51=HEAPU16[r15]+r175&65535;HEAP16[r15]=r51;HEAP16[r24]=r51;do{if((HEAP32[r34]|0)==0){r51=HEAP32[r26];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r51);break}else{_get_intra_block_B15(r1,r51);break}}else{if((r62|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r42,r52);r51=r54+8|0;r59=r50+r51|0;r11=HEAP32[r12];if((r11|0)>0){r36=HEAP32[r3];r49=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r11|HEAP32[r10];HEAP32[r10]=r49;HEAP32[r3]=r36+2|0;r36=r11-16|0;HEAP32[r12]=r36;r178=r36;r179=r49}else{r178=r11;r179=HEAP32[r10]}do{if(r179>>>0<4160749568){r11=r179>>>27;r49=HEAPU8[(r11<<1)+5253252|0];if((r11-16|0)>>>0<4){HEAP32[r10]=r179<<3;HEAP32[r12]=r178+3|0;r180=0;break}else{r36=HEAPU8[(r11<<1)+5253253|0];HEAP32[r12]=r36+r49+r178|0;r11=r179<<r36;r36=32-r49|0;HEAP32[r10]=r11<<r49;r180=(r11>>>(r36>>>0))-((r11^-2147483648)>>31>>>(r36>>>0))<<HEAP32[r9];break}}else{r36=(r179>>>23)-480|0;r11=HEAPU8[(r36<<1)+5253316|0];r49=HEAPU8[(r36<<1)+5253317|0];r36=r179<<r49;HEAP32[r10]=r36;r35=r178+r49|0;HEAP32[r12]=r35;if((r35|0)>0){r49=HEAP32[r3];r44=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r35|r36;HEAP32[r10]=r44;HEAP32[r3]=r49+2|0;r49=r35-16|0;HEAP32[r12]=r49;r181=r44;r182=r49}else{r181=r36;r182=r35}r35=32-r11|0;HEAP32[r10]=r181<<r11;HEAP32[r12]=r182+r11|0;r180=(r181>>>(r35>>>0))-((r181^-2147483648)>>31>>>(r35>>>0))<<HEAP32[r9]}}while(0);r42=HEAPU16[r15]+r180&65535;HEAP16[r15]=r42;HEAP16[r24]=r42;do{if((HEAP32[r34]|0)==0){r42=HEAP32[r26];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r42);break}else{_get_intra_block_B15(r1,r42);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r59,r52);r42=r53+r54|0;r35=r50+r42|0;r11=HEAP32[r12];if((r11|0)>0){r36=HEAP32[r3];r49=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r11|HEAP32[r10];HEAP32[r10]=r49;HEAP32[r3]=r36+2|0;r36=r11-16|0;HEAP32[r12]=r36;r183=r36;r184=r49}else{r183=r11;r184=HEAP32[r10]}do{if(r184>>>0<4160749568){r11=r184>>>27;r49=HEAPU8[(r11<<1)+5253252|0];if((r11-16|0)>>>0<4){HEAP32[r10]=r184<<3;HEAP32[r12]=r183+3|0;r185=0;break}else{r36=HEAPU8[(r11<<1)+5253253|0];HEAP32[r12]=r36+r49+r183|0;r11=r184<<r36;r36=32-r49|0;HEAP32[r10]=r11<<r49;r185=(r11>>>(r36>>>0))-((r11^-2147483648)>>31>>>(r36>>>0))<<HEAP32[r9];break}}else{r36=(r184>>>23)-480|0;r11=HEAPU8[(r36<<1)+5253316|0];r49=HEAPU8[(r36<<1)+5253317|0];r36=r184<<r49;HEAP32[r10]=r36;r44=r183+r49|0;HEAP32[r12]=r44;if((r44|0)>0){r49=HEAP32[r3];r45=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r44|r36;HEAP32[r10]=r45;HEAP32[r3]=r49+2|0;r49=r44-16|0;HEAP32[r12]=r49;r186=r45;r187=r49}else{r186=r36;r187=r44}r44=32-r11|0;HEAP32[r10]=r186<<r11;HEAP32[r12]=r187+r11|0;r185=(r186>>>(r44>>>0))-((r186^-2147483648)>>31>>>(r44>>>0))<<HEAP32[r9]}}while(0);r59=HEAPU16[r15]+r185&65535;HEAP16[r15]=r59;HEAP16[r24]=r59;do{if((HEAP32[r34]|0)==0){r59=HEAP32[r26];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r59);break}else{_get_intra_block_B15(r1,r59);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r35,r52);r59=r42+8|0;r44=r50+r59|0;r11=HEAP32[r12];if((r11|0)>0){r36=HEAP32[r3];r49=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r11|HEAP32[r10];HEAP32[r10]=r49;HEAP32[r3]=r36+2|0;r36=r11-16|0;HEAP32[r12]=r36;r188=r36;r189=r49}else{r188=r11;r189=HEAP32[r10]}do{if(r189>>>0<4160749568){r11=r189>>>27;r49=HEAPU8[(r11<<1)+5253252|0];if((r11-16|0)>>>0<4){HEAP32[r10]=r189<<3;HEAP32[r12]=r188+3|0;r190=0;break}else{r36=HEAPU8[(r11<<1)+5253253|0];HEAP32[r12]=r36+r49+r188|0;r11=r189<<r36;r36=32-r49|0;HEAP32[r10]=r11<<r49;r190=(r11>>>(r36>>>0))-((r11^-2147483648)>>31>>>(r36>>>0))<<HEAP32[r9];break}}else{r36=(r189>>>23)-480|0;r11=HEAPU8[(r36<<1)+5253316|0];r49=HEAPU8[(r36<<1)+5253317|0];r36=r189<<r49;HEAP32[r10]=r36;r45=r188+r49|0;HEAP32[r12]=r45;if((r45|0)>0){r49=HEAP32[r3];r46=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r45|r36;HEAP32[r10]=r46;HEAP32[r3]=r49+2|0;r49=r45-16|0;HEAP32[r12]=r49;r191=r46;r192=r49}else{r191=r36;r192=r45}r45=32-r11|0;HEAP32[r10]=r191<<r11;HEAP32[r12]=r192+r11|0;r190=(r191>>>(r45>>>0))-((r191^-2147483648)>>31>>>(r45>>>0))<<HEAP32[r9]}}while(0);r50=HEAPU16[r15]+r190&65535;HEAP16[r15]=r50;HEAP16[r24]=r50;do{if((HEAP32[r34]|0)==0){r50=HEAP32[r26];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r50);break}else{_get_intra_block_B15(r1,r50);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r44,r52);r50=HEAP32[r31];if((r50|0)==0){r35=r54>>1;r45=HEAP32[r33]+r35|0;r11=HEAP32[r55];r36=HEAP32[r12];if((r36|0)>0){r49=HEAP32[r3];r46=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r36|HEAP32[r10];HEAP32[r10]=r46;HEAP32[r3]=r49+2|0;r49=r36-16|0;HEAP32[r12]=r49;r193=r49;r194=r46}else{r193=r36;r194=HEAP32[r10]}do{if(r194>>>0<4160749568){r36=r194>>>27;r46=HEAPU8[(r36<<1)+5253380|0];if(r194>>>0<1073741824){HEAP32[r10]=r194<<2;HEAP32[r12]=r193+2|0;r195=0;break}else{r49=HEAPU8[(r36<<1)+5253381|0];HEAP32[r12]=r49+r46+r193|0;r36=r194<<r49;r49=32-r46|0;HEAP32[r10]=r36<<r46;r195=(r36>>>(r49>>>0))-((r36^-2147483648)>>31>>>(r49>>>0))<<HEAP32[r9];break}}else{r49=(r194>>>22)-992|0;r36=HEAPU8[(r49<<1)+5253316|0];r46=HEAPU8[(r49<<1)+5253317|0]+1|0;r49=r194<<r46;HEAP32[r10]=r49;r47=r46+r193|0;HEAP32[r12]=r47;if((r47|0)>0){r46=HEAP32[r3];r48=(HEAPU8[r46]<<8|HEAPU8[r46+1|0])<<r47|r49;HEAP32[r10]=r48;HEAP32[r3]=r46+2|0;r46=r47-16|0;HEAP32[r12]=r46;r196=r48;r197=r46}else{r196=r49;r197=r47}r47=32-r36|0;HEAP32[r10]=r196<<r36;HEAP32[r12]=r197+r36|0;r195=(r196>>>(r47>>>0))-((r196^-2147483648)>>31>>>(r47>>>0))<<HEAP32[r9]}}while(0);r44=HEAPU16[r14]+r195&65535;HEAP16[r14]=r44;HEAP16[r24]=r44;do{if((HEAP32[r34]|0)==0){r44=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r44);break}else{_get_intra_block_B15(r1,r44);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r45,r11);r44=HEAP32[r32]+r35|0;r47=HEAP32[r55];r36=HEAP32[r12];if((r36|0)>0){r49=HEAP32[r3];r46=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r36|HEAP32[r10];HEAP32[r10]=r46;HEAP32[r3]=r49+2|0;r49=r36-16|0;HEAP32[r12]=r49;r198=r49;r199=r46}else{r198=r36;r199=HEAP32[r10]}do{if(r199>>>0<4160749568){r36=r199>>>27;r46=HEAPU8[(r36<<1)+5253380|0];if(r199>>>0<1073741824){HEAP32[r10]=r199<<2;HEAP32[r12]=r198+2|0;r200=0;break}else{r49=HEAPU8[(r36<<1)+5253381|0];HEAP32[r12]=r49+r46+r198|0;r36=r199<<r49;r49=32-r46|0;HEAP32[r10]=r36<<r46;r200=(r36>>>(r49>>>0))-((r36^-2147483648)>>31>>>(r49>>>0))<<HEAP32[r9];break}}else{r49=(r199>>>22)-992|0;r36=HEAPU8[(r49<<1)+5253316|0];r46=HEAPU8[(r49<<1)+5253317|0]+1|0;r49=r199<<r46;HEAP32[r10]=r49;r48=r46+r198|0;HEAP32[r12]=r48;if((r48|0)>0){r46=HEAP32[r3];r201=(HEAPU8[r46]<<8|HEAPU8[r46+1|0])<<r48|r49;HEAP32[r10]=r201;HEAP32[r3]=r46+2|0;r46=r48-16|0;HEAP32[r12]=r46;r202=r201;r203=r46}else{r202=r49;r203=r48}r48=32-r36|0;HEAP32[r10]=r202<<r36;HEAP32[r12]=r203+r36|0;r200=(r202>>>(r48>>>0))-((r202^-2147483648)>>31>>>(r48>>>0))<<HEAP32[r9]}}while(0);r35=HEAPU16[r13]+r200&65535;HEAP16[r13]=r35;HEAP16[r24]=r35;do{if((HEAP32[r34]|0)==0){r35=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r35);break}else{_get_intra_block_B15(r1,r35);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r44,r47);if((HEAP32[r72]|0)!=4){r204=r74;break}r35=HEAP32[r12];if((r35|0)>0){r11=HEAP32[r3];r45=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r35|HEAP32[r10];HEAP32[r10]=r45;HEAP32[r3]=r11+2|0;r11=r35-16|0;HEAP32[r12]=r11;r205=r11;r206=r45}else{r205=r35;r206=HEAP32[r10]}HEAP32[r10]=r206<<1;HEAP32[r12]=r205+1|0;r204=r74;break}r35=HEAP32[r33];if((r50|0)==1){r45=r54>>1;r11=r35+r45|0;r48=HEAP32[r32];r36=r48+r45|0;r49=r52>>1;r46=r53>>1;r201=HEAP32[r12];if((r201|0)>0){r207=HEAP32[r3];r208=(HEAPU8[r207]<<8|HEAPU8[r207+1|0])<<r201|HEAP32[r10];HEAP32[r10]=r208;HEAP32[r3]=r207+2|0;r207=r201-16|0;HEAP32[r12]=r207;r209=r207;r210=r208}else{r209=r201;r210=HEAP32[r10]}do{if(r210>>>0<4160749568){r201=r210>>>27;r208=HEAPU8[(r201<<1)+5253380|0];if(r210>>>0<1073741824){HEAP32[r10]=r210<<2;HEAP32[r12]=r209+2|0;r211=0;break}else{r207=HEAPU8[(r201<<1)+5253381|0];HEAP32[r12]=r207+r208+r209|0;r201=r210<<r207;r207=32-r208|0;HEAP32[r10]=r201<<r208;r211=(r201>>>(r207>>>0))-((r201^-2147483648)>>31>>>(r207>>>0))<<HEAP32[r9];break}}else{r207=(r210>>>22)-992|0;r201=HEAPU8[(r207<<1)+5253316|0];r208=HEAPU8[(r207<<1)+5253317|0]+1|0;r207=r210<<r208;HEAP32[r10]=r207;r212=r208+r209|0;HEAP32[r12]=r212;if((r212|0)>0){r208=HEAP32[r3];r213=(HEAPU8[r208]<<8|HEAPU8[r208+1|0])<<r212|r207;HEAP32[r10]=r213;HEAP32[r3]=r208+2|0;r208=r212-16|0;HEAP32[r12]=r208;r214=r213;r215=r208}else{r214=r207;r215=r212}r212=32-r201|0;HEAP32[r10]=r214<<r201;HEAP32[r12]=r215+r201|0;r211=(r214>>>(r212>>>0))-((r214^-2147483648)>>31>>>(r212>>>0))<<HEAP32[r9]}}while(0);r53=HEAPU16[r14]+r211&65535;HEAP16[r14]=r53;HEAP16[r24]=r53;do{if((HEAP32[r34]|0)==0){r53=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r53);break}else{_get_intra_block_B15(r1,r53);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r11,r49);r53=HEAP32[r12];if((r53|0)>0){r50=HEAP32[r3];r47=(HEAPU8[r50]<<8|HEAPU8[r50+1|0])<<r53|HEAP32[r10];HEAP32[r10]=r47;HEAP32[r3]=r50+2|0;r50=r53-16|0;HEAP32[r12]=r50;r216=r50;r217=r47}else{r216=r53;r217=HEAP32[r10]}do{if(r217>>>0<4160749568){r53=r217>>>27;r47=HEAPU8[(r53<<1)+5253380|0];if(r217>>>0<1073741824){HEAP32[r10]=r217<<2;HEAP32[r12]=r216+2|0;r218=0;break}else{r50=HEAPU8[(r53<<1)+5253381|0];HEAP32[r12]=r50+r47+r216|0;r53=r217<<r50;r50=32-r47|0;HEAP32[r10]=r53<<r47;r218=(r53>>>(r50>>>0))-((r53^-2147483648)>>31>>>(r50>>>0))<<HEAP32[r9];break}}else{r50=(r217>>>22)-992|0;r53=HEAPU8[(r50<<1)+5253316|0];r47=HEAPU8[(r50<<1)+5253317|0]+1|0;r50=r217<<r47;HEAP32[r10]=r50;r44=r47+r216|0;HEAP32[r12]=r44;if((r44|0)>0){r47=HEAP32[r3];r212=(HEAPU8[r47]<<8|HEAPU8[r47+1|0])<<r44|r50;HEAP32[r10]=r212;HEAP32[r3]=r47+2|0;r47=r44-16|0;HEAP32[r12]=r47;r219=r212;r220=r47}else{r219=r50;r220=r44}r44=32-r53|0;HEAP32[r10]=r219<<r53;HEAP32[r12]=r220+r53|0;r218=(r219>>>(r44>>>0))-((r219^-2147483648)>>31>>>(r44>>>0))<<HEAP32[r9]}}while(0);r11=HEAPU16[r13]+r218&65535;HEAP16[r13]=r11;HEAP16[r24]=r11;do{if((HEAP32[r34]|0)==0){r11=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r11);break}else{_get_intra_block_B15(r1,r11);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r36,r49);r11=r46+r45|0;r44=r35+r11|0;r53=HEAP32[r12];if((r53|0)>0){r50=HEAP32[r3];r47=(HEAPU8[r50]<<8|HEAPU8[r50+1|0])<<r53|HEAP32[r10];HEAP32[r10]=r47;HEAP32[r3]=r50+2|0;r50=r53-16|0;HEAP32[r12]=r50;r221=r50;r222=r47}else{r221=r53;r222=HEAP32[r10]}do{if(r222>>>0<4160749568){r53=r222>>>27;r47=HEAPU8[(r53<<1)+5253380|0];if(r222>>>0<1073741824){HEAP32[r10]=r222<<2;HEAP32[r12]=r221+2|0;r223=0;break}else{r50=HEAPU8[(r53<<1)+5253381|0];HEAP32[r12]=r50+r47+r221|0;r53=r222<<r50;r50=32-r47|0;HEAP32[r10]=r53<<r47;r223=(r53>>>(r50>>>0))-((r53^-2147483648)>>31>>>(r50>>>0))<<HEAP32[r9];break}}else{r50=(r222>>>22)-992|0;r53=HEAPU8[(r50<<1)+5253316|0];r47=HEAPU8[(r50<<1)+5253317|0]+1|0;r50=r222<<r47;HEAP32[r10]=r50;r212=r47+r221|0;HEAP32[r12]=r212;if((r212|0)>0){r47=HEAP32[r3];r201=(HEAPU8[r47]<<8|HEAPU8[r47+1|0])<<r212|r50;HEAP32[r10]=r201;HEAP32[r3]=r47+2|0;r47=r212-16|0;HEAP32[r12]=r47;r224=r201;r225=r47}else{r224=r50;r225=r212}r212=32-r53|0;HEAP32[r10]=r224<<r53;HEAP32[r12]=r225+r53|0;r223=(r224>>>(r212>>>0))-((r224^-2147483648)>>31>>>(r212>>>0))<<HEAP32[r9]}}while(0);r45=HEAPU16[r14]+r223&65535;HEAP16[r14]=r45;HEAP16[r24]=r45;do{if((HEAP32[r34]|0)==0){r45=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r45);break}else{_get_intra_block_B15(r1,r45);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r44,r49);r45=r48+r11|0;r46=HEAP32[r12];if((r46|0)>0){r36=HEAP32[r3];r212=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r46|HEAP32[r10];HEAP32[r10]=r212;HEAP32[r3]=r36+2|0;r36=r46-16|0;HEAP32[r12]=r36;r226=r36;r227=r212}else{r226=r46;r227=HEAP32[r10]}do{if(r227>>>0<4160749568){r46=r227>>>27;r212=HEAPU8[(r46<<1)+5253380|0];if(r227>>>0<1073741824){HEAP32[r10]=r227<<2;HEAP32[r12]=r226+2|0;r228=0;break}else{r36=HEAPU8[(r46<<1)+5253381|0];HEAP32[r12]=r36+r212+r226|0;r46=r227<<r36;r36=32-r212|0;HEAP32[r10]=r46<<r212;r228=(r46>>>(r36>>>0))-((r46^-2147483648)>>31>>>(r36>>>0))<<HEAP32[r9];break}}else{r36=(r227>>>22)-992|0;r46=HEAPU8[(r36<<1)+5253316|0];r212=HEAPU8[(r36<<1)+5253317|0]+1|0;r36=r227<<r212;HEAP32[r10]=r36;r53=r212+r226|0;HEAP32[r12]=r53;if((r53|0)>0){r212=HEAP32[r3];r50=(HEAPU8[r212]<<8|HEAPU8[r212+1|0])<<r53|r36;HEAP32[r10]=r50;HEAP32[r3]=r212+2|0;r212=r53-16|0;HEAP32[r12]=r212;r229=r50;r230=r212}else{r229=r36;r230=r53}r53=32-r46|0;HEAP32[r10]=r229<<r46;HEAP32[r12]=r230+r46|0;r228=(r229>>>(r53>>>0))-((r229^-2147483648)>>31>>>(r53>>>0))<<HEAP32[r9]}}while(0);r11=HEAPU16[r13]+r228&65535;HEAP16[r13]=r11;HEAP16[r24]=r11;do{if((HEAP32[r34]|0)==0){r11=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r11);break}else{_get_intra_block_B15(r1,r11);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r45,r49);r204=r74;break}r11=r35+r54|0;r48=HEAP32[r32];r44=r48+r54|0;r53=HEAP32[r12];if((r53|0)>0){r46=HEAP32[r3];r36=(HEAPU8[r46]<<8|HEAPU8[r46+1|0])<<r53|HEAP32[r10];HEAP32[r10]=r36;HEAP32[r3]=r46+2|0;r46=r53-16|0;HEAP32[r12]=r46;r231=r46;r232=r36}else{r231=r53;r232=HEAP32[r10]}do{if(r232>>>0<4160749568){r53=r232>>>27;r36=HEAPU8[(r53<<1)+5253380|0];if(r232>>>0<1073741824){HEAP32[r10]=r232<<2;HEAP32[r12]=r231+2|0;r233=0;break}else{r46=HEAPU8[(r53<<1)+5253381|0];HEAP32[r12]=r46+r36+r231|0;r53=r232<<r46;r46=32-r36|0;HEAP32[r10]=r53<<r36;r233=(r53>>>(r46>>>0))-((r53^-2147483648)>>31>>>(r46>>>0))<<HEAP32[r9];break}}else{r46=(r232>>>22)-992|0;r53=HEAPU8[(r46<<1)+5253316|0];r36=HEAPU8[(r46<<1)+5253317|0]+1|0;r46=r232<<r36;HEAP32[r10]=r46;r212=r36+r231|0;HEAP32[r12]=r212;if((r212|0)>0){r36=HEAP32[r3];r50=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r212|r46;HEAP32[r10]=r50;HEAP32[r3]=r36+2|0;r36=r212-16|0;HEAP32[r12]=r36;r234=r50;r235=r36}else{r234=r46;r235=r212}r212=32-r53|0;HEAP32[r10]=r234<<r53;HEAP32[r12]=r235+r53|0;r233=(r234>>>(r212>>>0))-((r234^-2147483648)>>31>>>(r212>>>0))<<HEAP32[r9]}}while(0);r54=HEAPU16[r14]+r233&65535;HEAP16[r14]=r54;HEAP16[r24]=r54;do{if((HEAP32[r34]|0)==0){r54=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r54);break}else{_get_intra_block_B15(r1,r54);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r11,r52);r54=HEAP32[r12];if((r54|0)>0){r49=HEAP32[r3];r45=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r54|HEAP32[r10];HEAP32[r10]=r45;HEAP32[r3]=r49+2|0;r49=r54-16|0;HEAP32[r12]=r49;r236=r49;r237=r45}else{r236=r54;r237=HEAP32[r10]}do{if(r237>>>0<4160749568){r54=r237>>>27;r45=HEAPU8[(r54<<1)+5253380|0];if(r237>>>0<1073741824){HEAP32[r10]=r237<<2;HEAP32[r12]=r236+2|0;r238=0;break}else{r49=HEAPU8[(r54<<1)+5253381|0];HEAP32[r12]=r49+r45+r236|0;r54=r237<<r49;r49=32-r45|0;HEAP32[r10]=r54<<r45;r238=(r54>>>(r49>>>0))-((r54^-2147483648)>>31>>>(r49>>>0))<<HEAP32[r9];break}}else{r49=(r237>>>22)-992|0;r54=HEAPU8[(r49<<1)+5253316|0];r45=HEAPU8[(r49<<1)+5253317|0]+1|0;r49=r237<<r45;HEAP32[r10]=r49;r212=r45+r236|0;HEAP32[r12]=r212;if((r212|0)>0){r45=HEAP32[r3];r53=(HEAPU8[r45]<<8|HEAPU8[r45+1|0])<<r212|r49;HEAP32[r10]=r53;HEAP32[r3]=r45+2|0;r45=r212-16|0;HEAP32[r12]=r45;r239=r53;r240=r45}else{r239=r49;r240=r212}r212=32-r54|0;HEAP32[r10]=r239<<r54;HEAP32[r12]=r240+r54|0;r238=(r239>>>(r212>>>0))-((r239^-2147483648)>>31>>>(r212>>>0))<<HEAP32[r9]}}while(0);r11=HEAPU16[r13]+r238&65535;HEAP16[r13]=r11;HEAP16[r24]=r11;do{if((HEAP32[r34]|0)==0){r11=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r11);break}else{_get_intra_block_B15(r1,r11);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r44,r52);r11=r35+r42|0;r212=HEAP32[r12];if((r212|0)>0){r54=HEAP32[r3];r49=(HEAPU8[r54]<<8|HEAPU8[r54+1|0])<<r212|HEAP32[r10];HEAP32[r10]=r49;HEAP32[r3]=r54+2|0;r54=r212-16|0;HEAP32[r12]=r54;r241=r54;r242=r49}else{r241=r212;r242=HEAP32[r10]}do{if(r242>>>0<4160749568){r212=r242>>>27;r49=HEAPU8[(r212<<1)+5253380|0];if(r242>>>0<1073741824){HEAP32[r10]=r242<<2;HEAP32[r12]=r241+2|0;r243=0;break}else{r54=HEAPU8[(r212<<1)+5253381|0];HEAP32[r12]=r54+r49+r241|0;r212=r242<<r54;r54=32-r49|0;HEAP32[r10]=r212<<r49;r243=(r212>>>(r54>>>0))-((r212^-2147483648)>>31>>>(r54>>>0))<<HEAP32[r9];break}}else{r54=(r242>>>22)-992|0;r212=HEAPU8[(r54<<1)+5253316|0];r49=HEAPU8[(r54<<1)+5253317|0]+1|0;r54=r242<<r49;HEAP32[r10]=r54;r45=r49+r241|0;HEAP32[r12]=r45;if((r45|0)>0){r49=HEAP32[r3];r53=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r45|r54;HEAP32[r10]=r53;HEAP32[r3]=r49+2|0;r49=r45-16|0;HEAP32[r12]=r49;r244=r53;r245=r49}else{r244=r54;r245=r45}r45=32-r212|0;HEAP32[r10]=r244<<r212;HEAP32[r12]=r245+r212|0;r243=(r244>>>(r45>>>0))-((r244^-2147483648)>>31>>>(r45>>>0))<<HEAP32[r9]}}while(0);r44=HEAPU16[r14]+r243&65535;HEAP16[r14]=r44;HEAP16[r24]=r44;do{if((HEAP32[r34]|0)==0){r44=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r44);break}else{_get_intra_block_B15(r1,r44);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r11,r52);r44=r48+r42|0;r45=HEAP32[r12];if((r45|0)>0){r212=HEAP32[r3];r54=(HEAPU8[r212]<<8|HEAPU8[r212+1|0])<<r45|HEAP32[r10];HEAP32[r10]=r54;HEAP32[r3]=r212+2|0;r212=r45-16|0;HEAP32[r12]=r212;r246=r212;r247=r54}else{r246=r45;r247=HEAP32[r10]}do{if(r247>>>0<4160749568){r45=r247>>>27;r54=HEAPU8[(r45<<1)+5253380|0];if(r247>>>0<1073741824){HEAP32[r10]=r247<<2;HEAP32[r12]=r246+2|0;r248=0;break}else{r212=HEAPU8[(r45<<1)+5253381|0];HEAP32[r12]=r212+r54+r246|0;r45=r247<<r212;r212=32-r54|0;HEAP32[r10]=r45<<r54;r248=(r45>>>(r212>>>0))-((r45^-2147483648)>>31>>>(r212>>>0))<<HEAP32[r9];break}}else{r212=(r247>>>22)-992|0;r45=HEAPU8[(r212<<1)+5253316|0];r54=HEAPU8[(r212<<1)+5253317|0]+1|0;r212=r247<<r54;HEAP32[r10]=r212;r49=r54+r246|0;HEAP32[r12]=r49;if((r49|0)>0){r54=HEAP32[r3];r53=(HEAPU8[r54]<<8|HEAPU8[r54+1|0])<<r49|r212;HEAP32[r10]=r53;HEAP32[r3]=r54+2|0;r54=r49-16|0;HEAP32[r12]=r54;r249=r53;r250=r54}else{r249=r212;r250=r49}r49=32-r45|0;HEAP32[r10]=r249<<r45;HEAP32[r12]=r250+r45|0;r248=(r249>>>(r49>>>0))-((r249^-2147483648)>>31>>>(r49>>>0))<<HEAP32[r9]}}while(0);r42=HEAPU16[r13]+r248&65535;HEAP16[r13]=r42;HEAP16[r24]=r42;do{if((HEAP32[r34]|0)==0){r42=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r42);break}else{_get_intra_block_B15(r1,r42);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r44,r52);r42=r35+r51|0;r11=HEAP32[r12];if((r11|0)>0){r49=HEAP32[r3];r45=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r11|HEAP32[r10];HEAP32[r10]=r45;HEAP32[r3]=r49+2|0;r49=r11-16|0;HEAP32[r12]=r49;r251=r49;r252=r45}else{r251=r11;r252=HEAP32[r10]}do{if(r252>>>0<4160749568){r11=r252>>>27;r45=HEAPU8[(r11<<1)+5253380|0];if(r252>>>0<1073741824){HEAP32[r10]=r252<<2;HEAP32[r12]=r251+2|0;r253=0;break}else{r49=HEAPU8[(r11<<1)+5253381|0];HEAP32[r12]=r49+r45+r251|0;r11=r252<<r49;r49=32-r45|0;HEAP32[r10]=r11<<r45;r253=(r11>>>(r49>>>0))-((r11^-2147483648)>>31>>>(r49>>>0))<<HEAP32[r9];break}}else{r49=(r252>>>22)-992|0;r11=HEAPU8[(r49<<1)+5253316|0];r45=HEAPU8[(r49<<1)+5253317|0]+1|0;r49=r252<<r45;HEAP32[r10]=r49;r212=r45+r251|0;HEAP32[r12]=r212;if((r212|0)>0){r45=HEAP32[r3];r54=(HEAPU8[r45]<<8|HEAPU8[r45+1|0])<<r212|r49;HEAP32[r10]=r54;HEAP32[r3]=r45+2|0;r45=r212-16|0;HEAP32[r12]=r45;r254=r54;r255=r45}else{r254=r49;r255=r212}r212=32-r11|0;HEAP32[r10]=r254<<r11;HEAP32[r12]=r255+r11|0;r253=(r254>>>(r212>>>0))-((r254^-2147483648)>>31>>>(r212>>>0))<<HEAP32[r9]}}while(0);r44=HEAPU16[r14]+r253&65535;HEAP16[r14]=r44;HEAP16[r24]=r44;do{if((HEAP32[r34]|0)==0){r44=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r44);break}else{_get_intra_block_B15(r1,r44);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r42,r52);r44=r48+r51|0;r212=HEAP32[r12];if((r212|0)>0){r11=HEAP32[r3];r49=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r212|HEAP32[r10];HEAP32[r10]=r49;HEAP32[r3]=r11+2|0;r11=r212-16|0;HEAP32[r12]=r11;r256=r11;r257=r49}else{r256=r212;r257=HEAP32[r10]}do{if(r257>>>0<4160749568){r212=r257>>>27;r49=HEAPU8[(r212<<1)+5253380|0];if(r257>>>0<1073741824){HEAP32[r10]=r257<<2;HEAP32[r12]=r256+2|0;r258=0;break}else{r11=HEAPU8[(r212<<1)+5253381|0];HEAP32[r12]=r11+r49+r256|0;r212=r257<<r11;r11=32-r49|0;HEAP32[r10]=r212<<r49;r258=(r212>>>(r11>>>0))-((r212^-2147483648)>>31>>>(r11>>>0))<<HEAP32[r9];break}}else{r11=(r257>>>22)-992|0;r212=HEAPU8[(r11<<1)+5253316|0];r49=HEAPU8[(r11<<1)+5253317|0]+1|0;r11=r257<<r49;HEAP32[r10]=r11;r45=r49+r256|0;HEAP32[r12]=r45;if((r45|0)>0){r49=HEAP32[r3];r54=(HEAPU8[r49]<<8|HEAPU8[r49+1|0])<<r45|r11;HEAP32[r10]=r54;HEAP32[r3]=r49+2|0;r49=r45-16|0;HEAP32[r12]=r49;r259=r54;r260=r49}else{r259=r11;r260=r45}r45=32-r212|0;HEAP32[r10]=r259<<r212;HEAP32[r12]=r260+r212|0;r258=(r259>>>(r45>>>0))-((r259^-2147483648)>>31>>>(r45>>>0))<<HEAP32[r9]}}while(0);r51=HEAPU16[r13]+r258&65535;HEAP16[r13]=r51;HEAP16[r24]=r51;do{if((HEAP32[r34]|0)==0){r51=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r51);break}else{_get_intra_block_B15(r1,r51);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r44,r52);r51=r35+r59|0;r42=HEAP32[r12];if((r42|0)>0){r45=HEAP32[r3];r212=(HEAPU8[r45]<<8|HEAPU8[r45+1|0])<<r42|HEAP32[r10];HEAP32[r10]=r212;HEAP32[r3]=r45+2|0;r45=r42-16|0;HEAP32[r12]=r45;r261=r45;r262=r212}else{r261=r42;r262=HEAP32[r10]}do{if(r262>>>0<4160749568){r42=r262>>>27;r212=HEAPU8[(r42<<1)+5253380|0];if(r262>>>0<1073741824){HEAP32[r10]=r262<<2;HEAP32[r12]=r261+2|0;r263=0;break}else{r45=HEAPU8[(r42<<1)+5253381|0];HEAP32[r12]=r45+r212+r261|0;r42=r262<<r45;r45=32-r212|0;HEAP32[r10]=r42<<r212;r263=(r42>>>(r45>>>0))-((r42^-2147483648)>>31>>>(r45>>>0))<<HEAP32[r9];break}}else{r45=(r262>>>22)-992|0;r42=HEAPU8[(r45<<1)+5253316|0];r212=HEAPU8[(r45<<1)+5253317|0]+1|0;r45=r262<<r212;HEAP32[r10]=r45;r11=r212+r261|0;HEAP32[r12]=r11;if((r11|0)>0){r212=HEAP32[r3];r49=(HEAPU8[r212]<<8|HEAPU8[r212+1|0])<<r11|r45;HEAP32[r10]=r49;HEAP32[r3]=r212+2|0;r212=r11-16|0;HEAP32[r12]=r212;r264=r49;r265=r212}else{r264=r45;r265=r11}r11=32-r42|0;HEAP32[r10]=r264<<r42;HEAP32[r12]=r265+r42|0;r263=(r264>>>(r11>>>0))-((r264^-2147483648)>>31>>>(r11>>>0))<<HEAP32[r9]}}while(0);r35=HEAPU16[r14]+r263&65535;HEAP16[r14]=r35;HEAP16[r24]=r35;do{if((HEAP32[r34]|0)==0){r35=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r35);break}else{_get_intra_block_B15(r1,r35);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r51,r52);r35=r48+r59|0;r44=HEAP32[r12];if((r44|0)>0){r11=HEAP32[r3];r42=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r44|HEAP32[r10];HEAP32[r10]=r42;HEAP32[r3]=r11+2|0;r11=r44-16|0;HEAP32[r12]=r11;r266=r11;r267=r42}else{r266=r44;r267=HEAP32[r10]}do{if(r267>>>0<4160749568){r44=r267>>>27;r42=HEAPU8[(r44<<1)+5253380|0];if(r267>>>0<1073741824){HEAP32[r10]=r267<<2;HEAP32[r12]=r266+2|0;r268=0;break}else{r11=HEAPU8[(r44<<1)+5253381|0];HEAP32[r12]=r11+r42+r266|0;r44=r267<<r11;r11=32-r42|0;HEAP32[r10]=r44<<r42;r268=(r44>>>(r11>>>0))-((r44^-2147483648)>>31>>>(r11>>>0))<<HEAP32[r9];break}}else{r11=(r267>>>22)-992|0;r44=HEAPU8[(r11<<1)+5253316|0];r42=HEAPU8[(r11<<1)+5253317|0]+1|0;r11=r267<<r42;HEAP32[r10]=r11;r45=r42+r266|0;HEAP32[r12]=r45;if((r45|0)>0){r42=HEAP32[r3];r212=(HEAPU8[r42]<<8|HEAPU8[r42+1|0])<<r45|r11;HEAP32[r10]=r212;HEAP32[r3]=r42+2|0;r42=r45-16|0;HEAP32[r12]=r42;r269=r212;r270=r42}else{r269=r11;r270=r45}r45=32-r44|0;HEAP32[r10]=r269<<r44;HEAP32[r12]=r270+r44|0;r268=(r269>>>(r45>>>0))-((r269^-2147483648)>>31>>>(r45>>>0))<<HEAP32[r9]}}while(0);r59=HEAPU16[r13]+r268&65535;HEAP16[r13]=r59;HEAP16[r24]=r59;do{if((HEAP32[r34]|0)==0){r59=HEAP32[r39];if((HEAP32[r58]|0)==0){_get_intra_block_B14(r1,r59);break}else{_get_intra_block_B15(r1,r59);break}}else{if((HEAP32[r72]|0)==4){break}_get_mpeg1_intra_block(r1)}}while(0);FUNCTION_TABLE[HEAP32[1310841]](r28,r35,r52);r204=r74}else if(r5==2115){r5=0;HEAP16[r13]=16384;HEAP16[r14]=16384;HEAP16[r15]=16384;r204=r92}}while(0);r62=HEAP32[r64]+16|0;HEAP32[r64]=r62;if((r62|0)==(HEAP32[r63]|0)){r59=HEAP32[r8];do{if((r59|0)==0){r5=2119}else{FUNCTION_TABLE[r59](HEAP32[r71],r29,HEAP32[r2]);if((HEAP32[r72]|0)==3){break}else{r5=2119;break}}}while(0);if(r5==2119){r5=0;HEAP32[r30]=HEAP32[r30]+HEAP32[r68]|0;r59=HEAP32[r67];HEAP32[r33]=HEAP32[r33]+r59|0;HEAP32[r32]=HEAP32[r32]+r59|0}r59=HEAP32[r2]+16|0;HEAP32[r2]=r59;if(r59>>>0>HEAP32[r25]>>>0){r5=2121;break}HEAP32[r64]=0;r271=0}else{r271=r62}r59=HEAP32[r12];if((r59|0)>0){r48=HEAP32[r3];r51=(HEAPU8[r48]<<8|HEAPU8[r48+1|0])<<r59|HEAP32[r10];HEAP32[r10]=r51;HEAP32[r3]=r48+2|0;r48=r59-16|0;HEAP32[r12]=r48;r272=r48;r273=r51}else{r272=r59;r273=HEAP32[r10]}L2924:do{if(r273>>>0>268435455){r274=0;r275=r273;r276=r272;r5=2128}else{r59=0;r51=r273;r48=r272;while(1){r277=r51>>>21;if(r51>>>0>50331647){break}if((r277|0)==8){r278=r59+33|0}else if((r277|0)==15){r278=r59}else{r5=2136;break L2180}r45=r51<<11;HEAP32[r10]=r45;r44=r48+11|0;HEAP32[r12]=r44;if((r44|0)>0){r11=HEAP32[r3];r42=(HEAPU8[r11]<<8|HEAPU8[r11+1|0])<<r44|r45;HEAP32[r10]=r42;HEAP32[r3]=r11+2|0;r11=r48-5|0;HEAP32[r12]=r11;r279=r11;r280=r42}else{r279=r44;r280=r45}if(r280>>>0>268435455){r274=r278;r275=r280;r276=r279;r5=2128;break L2924}else{r59=r278;r51=r280;r48=r279}}r281=(r277-24<<1)+5253036|0;r282=r59;r283=r51;r284=r48;break}}while(0);if(r5==2128){r5=0;r281=((r275>>>27)-2<<1)+5252976|0;r282=r274;r283=r275;r284=r276}r62=HEAPU8[r281+1|0];HEAP32[r10]=r283<<r62;HEAP32[r12]=r284+r62|0;r62=HEAPU8[r281|0]+r282|0;if((r62|0)==0){continue}HEAP16[r13]=16384;HEAP16[r14]=16384;HEAP16[r15]=16384;if((HEAP32[r72]|0)==2){r52=r62;while(1){FUNCTION_TABLE[HEAP32[r69>>2]](r1,r16,5243300);r35=HEAP32[r64]+16|0;HEAP32[r64]=r35;if((r35|0)==(HEAP32[r63]|0)){r35=HEAP32[r8];do{if((r35|0)==0){r5=2153}else{FUNCTION_TABLE[r35](HEAP32[r71],r29,HEAP32[r2]);if((HEAP32[r72]|0)==3){break}else{r5=2153;break}}}while(0);if(r5==2153){r5=0;HEAP32[r30]=HEAP32[r30]+HEAP32[r68]|0;r35=HEAP32[r67];HEAP32[r33]=HEAP32[r33]+r35|0;HEAP32[r32]=HEAP32[r32]+r35|0}r35=HEAP32[r2]+16|0;HEAP32[r2]=r35;if(r35>>>0>HEAP32[r25]>>>0){r5=2155;break L2180}HEAP32[r64]=0}r35=r52-1|0;if((r35|0)==0){continue L2180}else{r52=r35}}}r52=(r204&8|0)!=0;r35=(r204&4|0)==0;r48=r52?5243332:5243300;if(r52){r52=r62;while(1){FUNCTION_TABLE[HEAP32[r70]](r1,r16,5243300);if(!r35){FUNCTION_TABLE[HEAP32[r70]](r1,r22,r48)}r51=HEAP32[r64]+16|0;HEAP32[r64]=r51;if((r51|0)==(HEAP32[r63]|0)){r51=HEAP32[r8];do{if((r51|0)==0){r5=2146}else{FUNCTION_TABLE[r51](HEAP32[r71],r29,HEAP32[r2]);if((HEAP32[r72]|0)==3){break}else{r5=2146;break}}}while(0);if(r5==2146){r5=0;HEAP32[r30]=HEAP32[r30]+HEAP32[r68]|0;r51=HEAP32[r67];HEAP32[r33]=HEAP32[r33]+r51|0;HEAP32[r32]=HEAP32[r32]+r51|0}r51=HEAP32[r2]+16|0;HEAP32[r2]=r51;if(r51>>>0>HEAP32[r25]>>>0){r5=2166;break L2180}HEAP32[r64]=0}r51=r52-1|0;if((r51|0)==0){continue L2180}else{r52=r51}}}else{r52=r62;r51=r271;while(1){if(r35){r285=r51}else{FUNCTION_TABLE[HEAP32[r70]](r1,r22,r48);r285=HEAP32[r64]}r59=r285+16|0;HEAP32[r64]=r59;if((r59|0)==(HEAP32[r63]|0)){r45=HEAP32[r8];do{if((r45|0)==0){r5=2164}else{FUNCTION_TABLE[r45](HEAP32[r71],r29,HEAP32[r2]);if((HEAP32[r72]|0)==3){break}else{r5=2164;break}}}while(0);if(r5==2164){r5=0;HEAP32[r30]=HEAP32[r30]+HEAP32[r68]|0;r45=HEAP32[r67];HEAP32[r33]=HEAP32[r33]+r45|0;HEAP32[r32]=HEAP32[r32]+r45|0}r45=HEAP32[r2]+16|0;HEAP32[r2]=r45;if(r45>>>0>HEAP32[r25]>>>0){r5=2166;break L2180}HEAP32[r64]=0;r286=0}else{r286=r59}r45=r52-1|0;if((r45|0)==0){continue L2180}else{r52=r45;r51=r286}}}}if(r5==2121){r286=HEAP32[1310869];if((r286|0)==0){STACKTOP=r6;return}FUNCTION_TABLE[r286](r7);STACKTOP=r6;return}else if(r5==2136){r286=HEAP32[1310869];if((r286|0)==0){STACKTOP=r6;return}FUNCTION_TABLE[r286](r7);STACKTOP=r6;return}else if(r5==2155){r286=HEAP32[1310869];if((r286|0)==0){STACKTOP=r6;return}FUNCTION_TABLE[r286](r7);STACKTOP=r6;return}else if(r5==2166){r5=HEAP32[1310869];if((r5|0)==0){STACKTOP=r6;return}FUNCTION_TABLE[r5](r7);STACKTOP=r6;return}}function _get_mpeg1_non_intra_block(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r3=HEAP32[r1+16864>>2];r4=HEAP32[r1+416>>2];r5=(r1|0)>>2;r6=HEAP32[r5];r7=(r1+4|0)>>2;r8=HEAP32[r7];r9=(r1+8|0)>>2;r10=HEAP32[r9];if((r8|0)>0){r11=r10+2|0;r12=r8-16|0;r13=(HEAPU8[r10]<<8|HEAPU8[r10+1|0])<<r8|r6}else{r11=r10;r12=r8;r13=r6}do{if(r13>>>0>671088639){r14=-1;r15=r11;r16=r12;r17=r13;r18=(((r13>>>27)-5)*3&-1)+5254356|0;r2=2187;break}else{r19=-1;r20=r11;r21=r12;r22=r13;r2=2192}}while(0);L3008:while(1){do{if(r2==2192){r2=0;if(r22>>>0<=67108863){if(r22>>>0>33554431){r13=(((r22>>>22)-8)*3&-1)+5254332|0;r12=HEAPU8[r13|0]+r19|0;if((r12|0)<64){r23=r12;r24=r20;r25=r21;r26=r22;r27=r13;r2=2188;break}else{r28=r12;r29=r20;r30=r21;r31=r22;r2=2215;break L3008}}if(r22>>>0>8388607){r12=(((r22>>>19)-16)*3&-1)+5254764|0;r13=HEAPU8[r12|0]+r19|0;if((r13|0)<64){r23=r13;r24=r20;r25=r21;r26=r22;r27=r12;r2=2188;break}else{r28=r13;r29=r20;r30=r21;r31=r22;r2=2214;break L3008}}if(r22>>>0>2097151){r13=(((r22>>>17)-16)*3&-1)+5254620|0;r12=HEAPU8[r13|0]+r19|0;if((r12|0)<64){r23=r12;r24=r20;r25=r21;r26=r22;r27=r13;r2=2188;break}else{r28=r12;r29=r20;r30=r21;r31=r22;r2=2212;break L3008}}else{r12=((r22>>>16)*3&-1)+5254524|0;r13=(HEAPU8[r20]<<8|HEAPU8[r20+1|0])<<r21+16|r22<<16;r11=r20+2|0;r6=HEAPU8[r12|0]+r19|0;if((r6|0)<64){r23=r6;r24=r11;r25=r21;r26=r13;r27=r12;r2=2188;break}else{r28=r6;r29=r11;r30=r21;r31=r13;r2=2213;break L3008}}}r13=(((r22>>>24)-4)*3&-1)+5254224|0;r11=HEAPU8[r13|0]+r19|0;if((r11|0)<64){r23=r11;r24=r20;r25=r21;r26=r22;r27=r13;r2=2188;break}r13=r11+(r22>>>20|-64)|0;if((r13|0)>63){r28=r13;r29=r20;r30=r21;r31=r22;r2=2216;break L3008}r11=HEAPU8[r3+r13|0];r6=r22<<12;r12=r21+12|0;if((r12|0)>0){r32=r20+2|0;r33=r21-4|0;r34=(HEAPU8[r20]<<8|HEAPU8[r20+1|0])<<r12|r6}else{r32=r20;r33=r12;r34=r6}r6=r34>>24;if((r6&127|0)==0){r35=r33+8|0;r36=r34<<8;r37=(r6<<1)+(r34>>>16&255)|0}else{r35=r33;r36=r34;r37=r6}r6=(Math.imul((r37>>31)+r37<<1|1,HEAPU16[r4+(r11<<1)>>1])|0)/32&-1;r12=(r6>>31^268435455)+r6<<4;r6=r12|16;if((r6|0)==(r6<<16>>16|0)){r38=r6}else{r38=r12>>31<<4^32752}HEAP16[r1+(r11<<1)+256>>1]=r38&65535;r11=r36<<8;r12=r35+8|0;if((r12|0)<=0){r39=r13;r40=r32;r41=r12;r42=r11;break}r39=r13;r40=r32+2|0;r41=r35-8|0;r42=(HEAPU8[r32]<<8|HEAPU8[r32+1|0])<<r12|r11;break}else if(r2==2187){r2=0;r11=HEAPU8[r18|0]+r14|0;if((r11|0)>63){r28=r11;r29=r15;r30=r16;r31=r17;r2=2211;break L3008}else{r23=r11;r24=r15;r25=r16;r26=r17;r27=r18;r2=2188;break}}}while(0);do{if(r2==2188){r2=0;r11=HEAPU8[r3+r23|0];r12=HEAPU8[r27+2|0];r13=r26<<r12;r6=r12+(r25+1)|0;r12=r13>>31;r8=(((Math.imul(HEAPU8[r27+1|0]<<1|1,HEAPU16[r4+(r11<<1)>>1])>>>5)+268435455|1)^r12)-r12|0;r12=r8<<4;if((r12|0)==(r8<<20>>16|0)){r43=r12}else{r43=r12>>31<<4^32752}HEAP16[r1+(r11<<1)+256>>1]=r43&65535;r11=r13<<1;if((r6|0)<=0){r39=r23;r40=r24;r41=r6;r42=r11;break}r39=r23;r40=r24+2|0;r41=r6-16|0;r42=(HEAPU8[r24]<<8|HEAPU8[r24+1|0])<<r6|r11}}while(0);if(r42>>>0<=671088639){r19=r39;r20=r40;r21=r41;r22=r42;r2=2192;continue}r14=r39;r15=r40;r16=r41;r17=r42;r18=(((r42>>>27)-5)*3&-1)+5254440|0;r2=2187;continue}if(r2==2212){r42=r31<<2;r18=r30+2|0;HEAP32[r5]=r42;HEAP32[r7]=r18;HEAP32[r9]=r29;return r28}else if(r2==2213){r42=r31<<2;r18=r30+2|0;HEAP32[r5]=r42;HEAP32[r7]=r18;HEAP32[r9]=r29;return r28}else if(r2==2211){r42=r31<<2;r18=r30+2|0;HEAP32[r5]=r42;HEAP32[r7]=r18;HEAP32[r9]=r29;return r28}else if(r2==2216){r42=r31<<2;r18=r30+2|0;HEAP32[r5]=r42;HEAP32[r7]=r18;HEAP32[r9]=r29;return r28}else if(r2==2214){r42=r31<<2;r18=r30+2|0;HEAP32[r5]=r42;HEAP32[r7]=r18;HEAP32[r9]=r29;return r28}else if(r2==2215){r42=r31<<2;r18=r30+2|0;HEAP32[r5]=r42;HEAP32[r7]=r18;HEAP32[r9]=r29;return r28}}function _get_non_intra_block(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r3=0;r4=HEAP32[r1+16864>>2];r5=r1|0;r6=HEAP32[r5>>2];r7=r1+4|0;r8=HEAP32[r7>>2];r9=r1+8|0;r10=HEAP32[r9>>2];if((r8|0)>0){r11=r10+2|0;r12=r8-16|0;r13=(HEAPU8[r10]<<8|HEAPU8[r10+1|0])<<r8|r6}else{r11=r10;r12=r8;r13=r6}do{if(r13>>>0>671088639){r14=-1;r15=r11;r16=r12;r17=r13;r18=(((r13>>>27)-5)*3&-1)+5254356|0;r19=-1;r3=2223;break}else{r20=-1;r21=r11;r22=r12;r23=r13;r24=-1;r3=2228}}while(0);L3057:while(1){do{if(r3==2223){r3=0;r13=HEAPU8[r18|0]+r14|0;if((r13|0)>63){r25=r13;r26=r15;r27=r16;r28=r17;r29=r19;break L3057}else{r30=r13;r31=r15;r32=r16;r33=r17;r34=r18;r35=r19;r3=2224;break}}else if(r3==2228){r3=0;if(r23>>>0<=67108863){if(r23>>>0>33554431){r13=(((r23>>>22)-8)*3&-1)+5254332|0;r12=HEAPU8[r13|0]+r20|0;if((r12|0)<64){r30=r12;r31=r21;r32=r22;r33=r23;r34=r13;r35=r24;r3=2224;break}else{r25=r12;r26=r21;r27=r22;r28=r23;r29=r24;break L3057}}if(r23>>>0>8388607){r12=(((r23>>>19)-16)*3&-1)+5254764|0;r13=HEAPU8[r12|0]+r20|0;if((r13|0)<64){r30=r13;r31=r21;r32=r22;r33=r23;r34=r12;r35=r24;r3=2224;break}else{r25=r13;r26=r21;r27=r22;r28=r23;r29=r24;break L3057}}if(r23>>>0>2097151){r13=(((r23>>>17)-16)*3&-1)+5254620|0;r12=HEAPU8[r13|0]+r20|0;if((r12|0)<64){r30=r12;r31=r21;r32=r22;r33=r23;r34=r13;r35=r24;r3=2224;break}else{r25=r12;r26=r21;r27=r22;r28=r23;r29=r24;break L3057}}else{r12=((r23>>>16)*3&-1)+5254524|0;r13=(HEAPU8[r21]<<8|HEAPU8[r21+1|0])<<r22+16|r23<<16;r11=r21+2|0;r6=HEAPU8[r12|0]+r20|0;if((r6|0)<64){r30=r6;r31=r11;r32=r22;r33=r13;r34=r12;r35=r24;r3=2224;break}else{r25=r6;r26=r11;r27=r22;r28=r13;r29=r24;break L3057}}}r13=(((r23>>>24)-4)*3&-1)+5254224|0;r11=HEAPU8[r13|0]+r20|0;if((r11|0)<64){r30=r11;r31=r21;r32=r22;r33=r23;r34=r13;r35=r24;r3=2224;break}r13=r11+(r23>>>20|-64)|0;if((r13|0)>63){r25=r13;r26=r21;r27=r22;r28=r23;r29=r24;break L3057}r11=HEAPU8[r4+r13|0];r6=r23<<12;r12=r22+12|0;if((r12|0)>0){r36=r21+2|0;r37=r22-4|0;r38=(HEAPU8[r21]<<8|HEAPU8[r21+1|0])<<r12|r6}else{r36=r21;r37=r12;r38=r6}r6=(Math.imul((r38>>20)+(r38>>31)<<1|1,HEAPU16[r2+(r11<<1)>>1])|0)/32&-1;r12=r6<<4;if((r12|0)==(r6<<20>>16|0)){r39=r12}else{r39=r12>>31<<4^32752}HEAP16[r1+(r11<<1)+256>>1]=r39&65535;r11=r39^r24;r12=r38<<12;r6=r37+12|0;if((r6|0)<=0){r40=r13;r41=r36;r42=r6;r43=r12;r44=r11;break}r40=r13;r41=r36+2|0;r42=r37-4|0;r43=(HEAPU8[r36]<<8|HEAPU8[r36+1|0])<<r6|r12;r44=r11;break}}while(0);do{if(r3==2224){r3=0;r11=HEAPU8[r4+r30|0];r12=HEAPU8[r34+2|0];r6=r33<<r12;r13=r12+(r32+1)|0;r12=r6>>31;r8=(Math.imul(HEAPU8[r34+1|0]<<1|1,HEAPU16[r2+(r11<<1)>>1])>>>5^r12)-r12|0;r12=r8<<4;if((r12|0)==(r8<<20>>16|0)){r45=r12}else{r45=r12>>31<<4^32752}HEAP16[r1+(r11<<1)+256>>1]=r45&65535;r11=r45^r35;r12=r6<<1;if((r13|0)<=0){r40=r30;r41=r31;r42=r13;r43=r12;r44=r11;break}r40=r30;r41=r31+2|0;r42=r13-16|0;r43=(HEAPU8[r31]<<8|HEAPU8[r31+1|0])<<r13|r12;r44=r11}}while(0);if(r43>>>0<=671088639){r20=r40;r21=r41;r22=r42;r23=r43;r24=r44;r3=2228;continue}r14=r40;r15=r41;r16=r42;r17=r43;r18=(((r43>>>27)-5)*3&-1)+5254440|0;r19=r44;r3=2223;continue}r3=r1+382|0;HEAP16[r3>>1]=(HEAPU16[r3>>1]^r29&16)&65535;HEAP32[r5>>2]=r28<<2;HEAP32[r7>>2]=r27+2|0;HEAP32[r9>>2]=r26;return r25}function _get_mpeg1_intra_block(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r2=0;r3=HEAP32[r1+16864>>2];r4=HEAP32[r1+412>>2];r5=(r1|0)>>2;r6=HEAP32[r5];r7=(r1+4|0)>>2;r8=HEAP32[r7];r9=(r1+8|0)>>2;r10=HEAP32[r9];do{if((r8|0)>0){r11=0;r12=r10+2|0;r13=r8-16|0;r14=(HEAPU8[r10]<<8|HEAPU8[r10+1|0])<<r8|r6;break}else{r11=0;r12=r10;r13=r8;r14=r6}}while(0);L3094:while(1){do{if(r14>>>0>671088639){r6=(((r14>>>27)-5)*3&-1)+5254440|0;r8=HEAPU8[r6|0]+r11|0;if((r8|0)>63){r15=r12;r16=r14;r2=2275;break L3094}else{r17=r8;r18=r12;r19=r14;r20=r6}}else{if(r14>>>0<=67108863){if(r14>>>0>33554431){r6=(((r14>>>22)-8)*3&-1)+5254332|0;r8=HEAPU8[r6|0]+r11|0;if((r8|0)<64){r17=r8;r18=r12;r19=r14;r20=r6;break}else{r15=r12;r16=r14;r2=2274;break L3094}}if(r14>>>0>8388607){r6=(((r14>>>19)-16)*3&-1)+5254764|0;r8=HEAPU8[r6|0]+r11|0;if((r8|0)<64){r17=r8;r18=r12;r19=r14;r20=r6;break}else{r15=r12;r16=r14;r2=2277;break L3094}}if(r14>>>0>2097151){r6=(((r14>>>17)-16)*3&-1)+5254620|0;r8=HEAPU8[r6|0]+r11|0;if((r8|0)<64){r17=r8;r18=r12;r19=r14;r20=r6;break}else{r15=r12;r16=r14;r2=2276;break L3094}}else{r6=((r14>>>16)*3&-1)+5254524|0;r8=(HEAPU8[r12]<<8|HEAPU8[r12+1|0])<<r13+16|r14<<16;r10=r12+2|0;r21=HEAPU8[r6|0]+r11|0;if((r21|0)<64){r17=r21;r18=r10;r19=r8;r20=r6;break}else{r15=r10;r16=r8;r2=2272;break L3094}}}r8=(((r14>>>24)-4)*3&-1)+5254224|0;r10=HEAPU8[r8|0]+r11|0;if((r10|0)<64){r17=r10;r18=r12;r19=r14;r20=r8;break}r8=r10+(r14>>>20|-64)|0;if((r8|0)>63){r15=r12;r16=r14;r2=2273;break L3094}r10=HEAPU8[r3+r8|0];r6=r14<<12;r21=r13+12|0;if((r21|0)>0){r22=r12+2|0;r23=r13-4|0;r24=(HEAPU8[r12]<<8|HEAPU8[r12+1|0])<<r21|r6}else{r22=r12;r23=r21;r24=r6}r6=r24>>24;if((r6&127|0)==0){r25=r23+8|0;r26=r24<<8;r27=(r6<<1)+(r24>>>16&255)|0}else{r25=r23;r26=r24;r27=r6}r6=(Math.imul(HEAPU16[r4+(r10<<1)>>1],r27)|0)/16&-1;r21=(r6>>31^268435455)+r6<<4;r6=r21|16;if((r6|0)==(r6<<16>>16|0)){r28=r6}else{r28=r21>>31<<4^32752}HEAP16[r1+(r10<<1)+256>>1]=r28&65535;r10=r26<<8;r21=r25+8|0;if((r21|0)<=0){r11=r8;r12=r22;r13=r21;r14=r10;continue L3094}r11=r8;r12=r22+2|0;r13=r25-8|0;r14=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r21|r10;continue L3094}}while(0);r10=HEAPU8[r3+r17|0];r21=HEAPU8[r20+2|0];r8=r19<<r21;r6=r21+(r13+1)|0;r21=r8>>31;r29=(((Math.imul(HEAPU16[r4+(r10<<1)>>1],HEAPU8[r20+1|0])>>>4)+268435455|1)^r21)-r21|0;r21=r29<<4;if((r21|0)==(r29<<20>>16|0)){r30=r21}else{r30=r21>>31<<4^32752}HEAP16[r1+(r10<<1)+256>>1]=r30&65535;r10=r8<<1;if((r6|0)<=0){r11=r17;r12=r18;r13=r6;r14=r10;continue}r11=r17;r12=r18+2|0;r13=r6-16|0;r14=(HEAPU8[r18]<<8|HEAPU8[r18+1|0])<<r6|r10}if(r2==2272){r18=r16<<2;r14=r13+2|0;HEAP32[r5]=r18;HEAP32[r7]=r14;HEAP32[r9]=r15;return}else if(r2==2274){r18=r16<<2;r14=r13+2|0;HEAP32[r5]=r18;HEAP32[r7]=r14;HEAP32[r9]=r15;return}else if(r2==2275){r18=r16<<2;r14=r13+2|0;HEAP32[r5]=r18;HEAP32[r7]=r14;HEAP32[r9]=r15;return}else if(r2==2273){r18=r16<<2;r14=r13+2|0;HEAP32[r5]=r18;HEAP32[r7]=r14;HEAP32[r9]=r15;return}else if(r2==2277){r18=r16<<2;r14=r13+2|0;HEAP32[r5]=r18;HEAP32[r7]=r14;HEAP32[r9]=r15;return}else if(r2==2276){r18=r16<<2;r14=r13+2|0;HEAP32[r5]=r18;HEAP32[r7]=r14;HEAP32[r9]=r15;return}}function _get_intra_block_B15(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r3=HEAP32[r1+16864>>2];r4=HEAP16[r1+256>>1]<<16>>16^-1;r5=r1|0;r6=HEAP32[r5>>2];r7=r1+4|0;r8=HEAP32[r7>>2];r9=r1+8|0;r10=HEAP32[r9>>2];do{if((r8|0)>0){r11=0;r12=r10+2|0;r13=r8-16|0;r14=(HEAPU8[r10]<<8|HEAPU8[r10+1|0])<<r8|r6;r15=r4;break}else{r11=0;r12=r10;r13=r8;r14=r6;r15=r4}}while(0);L3138:while(1){do{if(r14>>>0>67108863){r4=(((r14>>>24)-4)*3&-1)+5253444|0;r6=HEAPU8[r4|0]+r11|0;if((r6|0)<64){r16=r6;r17=r12;r18=r14;r19=r4;break}r4=r6+(r14>>>20|-64)|0;if((r4|0)>63){r20=r12;r21=r14;break L3138}r6=HEAPU8[r3+r4|0];r8=r14<<12;r10=r13+12|0;if((r10|0)>0){r22=r12+2|0;r23=r13-4|0;r24=(HEAPU8[r12]<<8|HEAPU8[r12+1|0])<<r10|r8}else{r22=r12;r23=r10;r24=r8}r8=(Math.imul(HEAPU16[r2+(r6<<1)>>1],r24>>20)|0)/16&-1;r10=r8<<4;if((r10|0)==(r8<<20>>16|0)){r25=r10}else{r25=r10>>31<<4^32752}HEAP16[r1+(r6<<1)+256>>1]=r25&65535;r6=r25^r15;r10=r24<<12;r8=r23+12|0;if((r8|0)<=0){r11=r4;r12=r22;r13=r8;r14=r10;r15=r6;continue L3138}r11=r4;r12=r22+2|0;r13=r23-4|0;r14=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r8|r10;r15=r6;continue L3138}else{if(r14>>>0>33554431){r6=(((r14>>>22)-8)*3&-1)+5254200|0;r10=HEAPU8[r6|0]+r11|0;if((r10|0)<64){r16=r10;r17=r12;r18=r14;r19=r6;break}else{r20=r12;r21=r14;break L3138}}if(r14>>>0>8388607){r6=(((r14>>>19)-16)*3&-1)+5254764|0;r10=HEAPU8[r6|0]+r11|0;if((r10|0)<64){r16=r10;r17=r12;r18=r14;r19=r6;break}else{r20=r12;r21=r14;break L3138}}if(r14>>>0>2097151){r6=(((r14>>>17)-16)*3&-1)+5254620|0;r10=HEAPU8[r6|0]+r11|0;if((r10|0)<64){r16=r10;r17=r12;r18=r14;r19=r6;break}else{r20=r12;r21=r14;break L3138}}else{r6=((r14>>>16)*3&-1)+5254524|0;r10=(HEAPU8[r12]<<8|HEAPU8[r12+1|0])<<r13+16|r14<<16;r8=r12+2|0;r4=HEAPU8[r6|0]+r11|0;if((r4|0)<64){r16=r4;r17=r8;r18=r10;r19=r6;break}else{r20=r8;r21=r10;break L3138}}}}while(0);r10=HEAPU8[r3+r16|0];r8=HEAPU8[r19+2|0];r6=r18<<r8;r4=r8+(r13+1)|0;r8=r6>>31;r26=(Math.imul(HEAPU16[r2+(r10<<1)>>1],HEAPU8[r19+1|0])>>>4^r8)-r8|0;r8=r26<<4;if((r8|0)==(r26<<20>>16|0)){r27=r8}else{r27=r26>>27<<4^32752}HEAP16[r1+(r10<<1)+256>>1]=r27&65535;r10=r27^r15;r26=r6<<1;if((r4|0)<=0){r11=r16;r12=r17;r13=r4;r14=r26;r15=r10;continue}r11=r16;r12=r17+2|0;r13=r4-16|0;r14=(HEAPU8[r17]<<8|HEAPU8[r17+1|0])<<r4|r26;r15=r10}r17=r1+382|0;HEAP16[r17>>1]=(HEAPU16[r17>>1]^r15&16)&65535;HEAP32[r5>>2]=r21<<4;HEAP32[r7>>2]=r13+4|0;HEAP32[r9>>2]=r20;return}function _get_intra_block_B14(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r3=HEAP32[r1+16864>>2];r4=HEAP16[r1+256>>1]<<16>>16^-1;r5=r1|0;r6=HEAP32[r5>>2];r7=r1+4|0;r8=HEAP32[r7>>2];r9=r1+8|0;r10=HEAP32[r9>>2];do{if((r8|0)>0){r11=0;r12=r10+2|0;r13=r8-16|0;r14=(HEAPU8[r10]<<8|HEAPU8[r10+1|0])<<r8|r6;r15=r4;break}else{r11=0;r12=r10;r13=r8;r14=r6;r15=r4}}while(0);L3170:while(1){do{if(r14>>>0>671088639){r4=(((r14>>>27)-5)*3&-1)+5254440|0;r6=HEAPU8[r4|0]+r11|0;if((r6|0)>63){r16=r12;r17=r14;break L3170}else{r18=r6;r19=r12;r20=r14;r21=r4}}else{if(r14>>>0<=67108863){if(r14>>>0>33554431){r4=(((r14>>>22)-8)*3&-1)+5254332|0;r6=HEAPU8[r4|0]+r11|0;if((r6|0)<64){r18=r6;r19=r12;r20=r14;r21=r4;break}else{r16=r12;r17=r14;break L3170}}if(r14>>>0>8388607){r4=(((r14>>>19)-16)*3&-1)+5254764|0;r6=HEAPU8[r4|0]+r11|0;if((r6|0)<64){r18=r6;r19=r12;r20=r14;r21=r4;break}else{r16=r12;r17=r14;break L3170}}if(r14>>>0>2097151){r4=(((r14>>>17)-16)*3&-1)+5254620|0;r6=HEAPU8[r4|0]+r11|0;if((r6|0)<64){r18=r6;r19=r12;r20=r14;r21=r4;break}else{r16=r12;r17=r14;break L3170}}else{r4=((r14>>>16)*3&-1)+5254524|0;r6=(HEAPU8[r12]<<8|HEAPU8[r12+1|0])<<r13+16|r14<<16;r8=r12+2|0;r10=HEAPU8[r4|0]+r11|0;if((r10|0)<64){r18=r10;r19=r8;r20=r6;r21=r4;break}else{r16=r8;r17=r6;break L3170}}}r6=(((r14>>>24)-4)*3&-1)+5254224|0;r8=HEAPU8[r6|0]+r11|0;if((r8|0)<64){r18=r8;r19=r12;r20=r14;r21=r6;break}r6=r8+(r14>>>20|-64)|0;if((r6|0)>63){r16=r12;r17=r14;break L3170}r8=HEAPU8[r3+r6|0];r4=r14<<12;r10=r13+12|0;if((r10|0)>0){r22=r12+2|0;r23=r13-4|0;r24=(HEAPU8[r12]<<8|HEAPU8[r12+1|0])<<r10|r4}else{r22=r12;r23=r10;r24=r4}r4=(Math.imul(HEAPU16[r2+(r8<<1)>>1],r24>>20)|0)/16&-1;r10=r4<<4;if((r10|0)==(r4<<20>>16|0)){r25=r10}else{r25=r10>>31<<4^32752}HEAP16[r1+(r8<<1)+256>>1]=r25&65535;r8=r25^r15;r10=r24<<12;r4=r23+12|0;if((r4|0)<=0){r11=r6;r12=r22;r13=r4;r14=r10;r15=r8;continue L3170}r11=r6;r12=r22+2|0;r13=r23-4|0;r14=(HEAPU8[r22]<<8|HEAPU8[r22+1|0])<<r4|r10;r15=r8;continue L3170}}while(0);r8=HEAPU8[r3+r18|0];r10=HEAPU8[r21+2|0];r4=r20<<r10;r6=r10+(r13+1)|0;r10=r4>>31;r26=(Math.imul(HEAPU16[r2+(r8<<1)>>1],HEAPU8[r21+1|0])>>>4^r10)-r10|0;r10=r26<<4;if((r10|0)==(r26<<20>>16|0)){r27=r10}else{r27=r26>>27<<4^32752}HEAP16[r1+(r8<<1)+256>>1]=r27&65535;r8=r27^r15;r26=r4<<1;if((r6|0)<=0){r11=r18;r12=r19;r13=r6;r14=r26;r15=r8;continue}r11=r18;r12=r19+2|0;r13=r6-16|0;r14=(HEAPU8[r19]<<8|HEAPU8[r19+1|0])<<r6|r26;r15=r8}r19=r1+382|0;HEAP16[r19>>1]=(HEAPU16[r19>>1]^r15&16)&65535;HEAP32[r5>>2]=r17<<2;HEAP32[r7>>2]=r13+2|0;HEAP32[r9>>2]=r16;return}function _mpeg2convert_rgb32(r1,r2,r3,r4,r5,r6,r7){return _rgb_internal(0,32,r1,r2,r3,r4,r7)}function _rgb_c_24_bgr_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r4=r1+12|0;r5=HEAP32[r4>>2];r6=r1+8|0;r7=r1+4|0;r8=(r1+60|0)>>2;r9=(r1+1084|0)>>2;r10=(r1+2108|0)>>2;r11=(r1+3132|0)>>2;r12=r1+16|0;r13=r1+20|0;r14=r1+24|0;r15=HEAP32[r1>>2]+Math.imul(r5,r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r16=HEAP32[r2+8>>2];r2=7;r17=r5;while(1){r5=HEAP32[r7>>2];r18=r5*24&-1;r19=r5<<3;r20=r5<<2;r21=r15+r17|0;r22=r15;r23=r3;r24=r1;r25=r16;r26=r3+HEAP32[r6>>2]|0;r27=r5;while(1){r5=HEAPU8[r24];r28=HEAPU8[r25];r29=HEAP32[(r28<<2>>2)+r8];r30=HEAP32[(r5<<2>>2)+r9];r31=HEAP32[(r28<<2>>2)+r10];r28=HEAP32[(r5<<2>>2)+r11];r5=HEAPU8[r23];HEAP8[r22]=HEAP8[r28+r5|0];HEAP8[r22+1|0]=HEAP8[r30+r5+r31|0];HEAP8[r22+2|0]=HEAP8[r29+r5|0];r5=HEAPU8[r23+1|0];HEAP8[r22+3|0]=HEAP8[r28+r5|0];HEAP8[r22+4|0]=HEAP8[r30+r5+r31|0];HEAP8[r22+5|0]=HEAP8[r29+r5|0];r5=HEAPU8[r26];HEAP8[r21]=HEAP8[r28+r5|0];HEAP8[r21+1|0]=HEAP8[r30+r5+r31|0];HEAP8[r21+2|0]=HEAP8[r29+r5|0];r5=HEAPU8[r26+1|0];HEAP8[r21+3|0]=HEAP8[r28+r5|0];HEAP8[r21+4|0]=HEAP8[r30+r5+r31|0];HEAP8[r21+5|0]=HEAP8[r29+r5|0];r5=HEAPU8[r24+1|0];r29=HEAPU8[r25+1|0];r31=HEAP32[(r29<<2>>2)+r8];r30=HEAP32[(r5<<2>>2)+r9];r28=HEAP32[(r29<<2>>2)+r10];r29=HEAP32[(r5<<2>>2)+r11];r5=HEAPU8[r26+2|0];HEAP8[r21+6|0]=HEAP8[r29+r5|0];HEAP8[r21+7|0]=HEAP8[r30+r5+r28|0];HEAP8[r21+8|0]=HEAP8[r31+r5|0];r5=HEAPU8[r26+3|0];HEAP8[r21+9|0]=HEAP8[r29+r5|0];HEAP8[r21+10|0]=HEAP8[r30+r5+r28|0];HEAP8[r21+11|0]=HEAP8[r31+r5|0];r5=HEAPU8[r23+2|0];HEAP8[r22+6|0]=HEAP8[r29+r5|0];HEAP8[r22+7|0]=HEAP8[r30+r5+r28|0];HEAP8[r22+8|0]=HEAP8[r31+r5|0];r5=HEAPU8[r23+3|0];HEAP8[r22+9|0]=HEAP8[r29+r5|0];HEAP8[r22+10|0]=HEAP8[r30+r5+r28|0];HEAP8[r22+11|0]=HEAP8[r31+r5|0];r5=HEAPU8[r24+2|0];r31=HEAPU8[r25+2|0];r28=HEAP32[(r31<<2>>2)+r8];r30=HEAP32[(r5<<2>>2)+r9];r29=HEAP32[(r31<<2>>2)+r10];r31=HEAP32[(r5<<2>>2)+r11];r5=HEAPU8[r23+4|0];HEAP8[r22+12|0]=HEAP8[r31+r5|0];HEAP8[r22+13|0]=HEAP8[r30+r5+r29|0];HEAP8[r22+14|0]=HEAP8[r28+r5|0];r5=HEAPU8[r23+5|0];HEAP8[r22+15|0]=HEAP8[r31+r5|0];HEAP8[r22+16|0]=HEAP8[r30+r5+r29|0];HEAP8[r22+17|0]=HEAP8[r28+r5|0];r5=HEAPU8[r26+4|0];HEAP8[r21+12|0]=HEAP8[r31+r5|0];HEAP8[r21+13|0]=HEAP8[r30+r5+r29|0];HEAP8[r21+14|0]=HEAP8[r28+r5|0];r5=HEAPU8[r26+5|0];HEAP8[r21+15|0]=HEAP8[r31+r5|0];HEAP8[r21+16|0]=HEAP8[r30+r5+r29|0];HEAP8[r21+17|0]=HEAP8[r28+r5|0];r5=HEAPU8[r24+3|0];r28=HEAPU8[r25+3|0];r29=HEAP32[(r28<<2>>2)+r8];r30=HEAP32[(r5<<2>>2)+r9];r31=HEAP32[(r28<<2>>2)+r10];r28=HEAP32[(r5<<2>>2)+r11];r5=HEAPU8[r26+6|0];HEAP8[r21+18|0]=HEAP8[r28+r5|0];HEAP8[r21+19|0]=HEAP8[r30+r5+r31|0];HEAP8[r21+20|0]=HEAP8[r29+r5|0];r5=HEAPU8[r26+7|0];HEAP8[r21+21|0]=HEAP8[r28+r5|0];HEAP8[r21+22|0]=HEAP8[r30+r5+r31|0];HEAP8[r21+23|0]=HEAP8[r29+r5|0];r5=HEAPU8[r23+6|0];HEAP8[r22+18|0]=HEAP8[r28+r5|0];HEAP8[r22+19|0]=HEAP8[r30+r5+r31|0];HEAP8[r22+20|0]=HEAP8[r29+r5|0];r5=HEAPU8[r23+7|0];HEAP8[r22+21|0]=HEAP8[r28+r5|0];HEAP8[r22+22|0]=HEAP8[r30+r5+r31|0];HEAP8[r22+23|0]=HEAP8[r29+r5|0];r5=r27-1|0;if((r5|0)==0){break}else{r21=r21+24|0;r22=r22+24|0;r23=r23+8|0;r24=r24+4|0;r25=r25+4|0;r26=r26+8|0;r27=r5}}r27=HEAP32[r13>>2];if((r2|0)==0){break}r15=r15+r18+HEAP32[r14>>2]|0;r3=r3+r19+HEAP32[r12>>2]|0;r1=r1+r20+r27|0;r16=r16+r20+r27|0;r2=r2-1|0;r17=HEAP32[r4>>2]}return}function _rgb_internal(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r8=r7>>2;r7=r4>>2;r9=0;r10=STACKTOP;STACKTOP=STACKTOP+1024|0;r11=r10;r12=r5+12|0;r13=HEAP32[r12>>2];r14=(r5+4|0)>>2;r15=HEAP32[r14];r16=r13>>>0<r15>>>0;r17=(r2+7|0)>>>3;r18=(r5|0)>>2;r19=HEAP32[r18];r20=Math.imul(r19,r17);r21=0;while(1){r22=(r21*76309&-1)-30490832>>16;if((r22|0)<0){r23=0}else{r23=(r22|0)>255?-1:r22&255}HEAP8[r11+r21|0]=r23;r22=r21+1|0;if((r22|0)==1024){break}else{r21=r22}}r21=r16&1;r16=r4>>2;L3218:do{if((r2|0)==24){if((r4|0)==0){r24=4876;r25=r19;r26=r13;r27=r15;break}r23=r4+4388|0;_memcpy(r4+4156|0,r11+152|0,720);r28=r23;r29=r23;r30=r23;r31=1;r9=2362;break}else if((r2|0)==32){if((r4|0)==0){r24=11952;r25=r19;r26=r13;r27=r15;break}r23=r4+7684|0;r22=(r1|0)==0;r32=r22?16:0;r33=-197;while(1){HEAP32[((r33+182<<2)+4216>>2)+r16]=HEAPU8[r33+(r11+384)|0]<<r32;r34=r33+1|0;if((r34|0)==453){break}else{r33=r34}}r33=r4+4944|0;r32=r4+10400|0;r34=-132;while(1){HEAP32[((r34+1546<<2)+4216>>2)+r16]=HEAPU8[r34+(r11+384)|0]<<8;r35=r34+1|0;if((r35|0)==388){break}else{r34=r35}}r34=r22?0:16;r35=-232;while(1){HEAP32[((r35+867<<2)+4216>>2)+r16]=HEAPU8[r35+(r11+384)|0]<<r34;r36=r35+1|0;if((r36|0)==488){r28=r23;r29=r32;r30=r33;r31=4;r9=2362;break L3218}else{r35=r36}}}else if((r2|0)==8){if((r4|0)==0){r24=6276;r25=r19;r26=r13;r27=r15;break}r35=(r1|0)==0;r33=r35?5:0;r32=-197;while(1){HEAP8[r32+(r4+4353)|0]=Math.floor(((HEAPU8[r32+(r11+384)|0]*7&-1)>>>0)/255)<<r33&255;r23=r32+1|0;if((r23|0)==483){break}else{r32=r23}}r32=r4+5065|0;r33=r4+4353|0;r23=r35?2:3;r34=-132;while(1){HEAP8[r34+(r4+5035)|0]=Math.floor(((HEAPU8[r34+(r11+384)|0]*7&-1)>>>0)/255)<<r23&255;r22=r34+1|0;if((r22|0)==418){break}else{r34=r22}}r34=r4+5717|0;r23=r35?0:6;r22=-232;while(1){HEAP8[r22+(r4+5717)|0]=(Math.floor(HEAPU8[r22+(r11+384)|0]/85)&255)<<r23&255;r36=r22+1|0;if((r36|0)==559){r28=r34;r29=r32;r30=r33;r31=1;r9=2362;break L3218}else{r22=r36}}}else if((r2|0)==15|(r2|0)==16){if((r4|0)==0){r24=8054;r25=r19;r26=r13;r27=r15;break}r22=r4+4156|0;r33=r4+5920|0;r32=(r2|0)==16;r34=r32?11:10;r23=(r1|0)==0?r34:0;r35=-197;while(1){HEAP16[r22+(r35+197<<1)>>1]=HEAPU8[r35+(r11+384)|0]>>>3<<r23&65535;r36=r35+1|0;if((r36|0)==453){break}else{r35=r36}}r35=r4+4550|0;r23=r4+7278|0;r36=r32?2:3;r37=-132;while(1){HEAP16[r22+(r37+1561<<1)>>1]=HEAPU8[r37+(r11+384)|0]>>>(r36>>>0)<<5&65535;r38=r37+1|0;if((r38|0)==388){break}else{r37=r38}}r37=r33;if((r1|0)==1){r36=-232;while(1){HEAP16[r37+(r36<<1)>>1]=HEAPU8[r36+(r11+384)|0]>>>3<<r34&65535;r22=r36+1|0;if((r22|0)==488){r28=r33;r29=r23;r30=r35;r31=2;r9=2362;break L3218}else{r36=r22}}}else{r36=-232;while(1){HEAP16[r37+(r36<<1)>>1]=(HEAP8[r36+(r11+384)|0]&255)>>>3;r34=r36+1|0;if((r34|0)==488){r28=r33;r29=r23;r30=r35;r31=2;r9=2362;break L3218}else{r36=r34}}}}else{r28=0;r29=0;r30=0;r31=0;r9=2362}}while(0);if(r9==2362){r9=0;while(1){r11=r9-128|0;r4=r11*104597&-1;if((r4|0)>0){r39=(r4+38154|0)/76309&-1}else{r39=(38154-r4|0)/-76309&-1}HEAP32[((r9<<2)+60>>2)+r16]=r30+Math.imul(r39,r31)|0;r4=r11*-25675&-1;if((r4|0)>0){r40=(r4+38154|0)/76309&-1}else{r40=(38154-r4|0)/-76309&-1}HEAP32[((r9<<2)+1084>>2)+r16]=r29+Math.imul(r40,r31)|0;r4=r11*-53279&-1;if((r4|0)>0){r41=(r4+38154|0)/76309&-1}else{r41=(38154-r4|0)/-76309&-1}HEAP32[((r9<<2)+2108>>2)+r16]=Math.imul(r41,r31);r4=r11*132201&-1;if((r4|0)>0){r42=(r4+38154|0)/76309&-1}else{r42=(38154-r4|0)/-76309&-1}HEAP32[((r9<<2)+3132>>2)+r16]=r28+Math.imul(r42,r31)|0;r4=r9+1|0;if((r4|0)==256){break}else{r9=r4}}r24=4156;r25=HEAP32[r18];r26=HEAP32[r12>>2];r27=HEAP32[r14]}r12=r5+8|0;r5=HEAP32[((((r26|0)==(r27|0)&1)+((HEAP32[r12>>2]|0)==(r25|0)&1))*20&-1)+(((r2|0)==24&(r1|0)==1?0:r17)<<2)+5242884>>2];HEAP32[r8]=r24;r24=(r20|0)>(r6|0)?r20:r6;if((r3|0)==1){r43=r24;STACKTOP=r10;return r43}else if((r3|0)==2){HEAP32[r7+1]=HEAP32[r18]>>>3;HEAP32[r7+11]=HEAP32[r18];HEAP32[r7+12]=HEAP32[r12>>2];HEAP32[r7+13]=r24;HEAP32[r7+14]=r20;HEAP32[r7+7]=r21;HEAP32[r7+8]=r21;HEAP32[r8+1]=Math.imul(HEAP32[r14],r24);HEAP32[r8+3]=0;HEAP32[r8+2]=0;HEAP32[r8+4]=132;HEAP32[r8+5]=r5}r43=0;STACKTOP=r10;return r43}function _rgb_c_8_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65;r4=HEAP32[r1+36>>2];r5=r1+12|0;r6=HEAP32[r5>>2];r7=r1+8|0;r8=r1+4|0;r9=(r1+60|0)>>2;r10=(r1+1084|0)>>2;r11=(r1+2108|0)>>2;r12=(r1+3132|0)>>2;r13=r1+16|0;r14=r1+20|0;r15=r1+24|0;r16=r1+40|0;r17=HEAP32[r1>>2]+Math.imul(r6,r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r18=HEAP32[r2+8>>2];r2=7;r19=r4;r4=r6;while(1){r6=r19&255;r20=r6<<1;r21=HEAP32[r8>>2];r22=HEAPU8[r20+5251516|0];r23=HEAPU8[(r20|1)+5251516|0];r24=HEAPU8[r20+5251518|0];r25=HEAPU8[r20+5251519|0];r26=HEAPU8[r20+5251612|0];r27=HEAPU8[r20+5251613|0];r28=HEAPU8[r20+5251614|0];r29=HEAPU8[r20+5251615|0];r30=HEAPU8[r20+5251616|0];r31=HEAPU8[r20+5251617|0];r32=HEAPU8[r20+5251618|0];r33=HEAPU8[r20+5251619|0];r34=HEAPU8[r20+5251520|0];r35=HEAPU8[r20+5251521|0];r36=HEAPU8[r20+5251522|0];r37=HEAPU8[r20+5251523|0];r38=HEAPU8[r20+5251524|0];r39=HEAPU8[r20+5251525|0];r40=HEAPU8[r20+5251526|0];r41=HEAPU8[r20+5251527|0];r42=HEAPU8[r20+5251620|0];r43=HEAPU8[r20+5251621|0];r44=HEAPU8[r20+5251622|0];r45=HEAPU8[r20+5251623|0];r46=HEAPU8[r20+5251624|0];r47=HEAPU8[r20+5251625|0];r48=HEAPU8[r20+5251626|0];r49=HEAPU8[r20+5251627|0];r50=HEAPU8[r20+5251528|0];r51=HEAPU8[r20+5251529|0];r52=HEAPU8[r20+5251530|0];r53=HEAPU8[r20+5251531|0];r20=r21<<3;r54=r21<<2;r55=r17;r56=r17+r4|0;r57=r3;r58=r1;r59=r18;r60=r3+HEAP32[r7>>2]|0;r61=r21;while(1){r21=HEAPU8[r58];r62=HEAPU8[r59];r63=HEAP32[(r62<<2>>2)+r9];r64=HEAP32[(r21<<2>>2)+r10];r65=HEAP32[(r62<<2>>2)+r11];r62=HEAP32[(r21<<2>>2)+r12];r21=HEAPU8[r57];HEAP8[r55]=(HEAP8[r64+(r21+r65-r22)|0]+HEAP8[r63+r22+r21|0]&255)+HEAP8[r62+r23+r21|0]&255;r21=HEAPU8[r57+1|0];HEAP8[r55+1|0]=(HEAP8[r64+(r21+r65-r24)|0]+HEAP8[r63+r24+r21|0]&255)+HEAP8[r62+r25+r21|0]&255;r21=HEAPU8[r60];HEAP8[r56]=(HEAP8[r64+(r21+r65-r26)|0]+HEAP8[r63+r26+r21|0]&255)+HEAP8[r62+r27+r21|0]&255;r21=HEAPU8[r60+1|0];HEAP8[r56+1|0]=(HEAP8[r64+(r21+r65-r28)|0]+HEAP8[r63+r28+r21|0]&255)+HEAP8[r62+r29+r21|0]&255;r21=HEAPU8[r58+1|0];r62=HEAPU8[r59+1|0];r63=HEAP32[(r62<<2>>2)+r9];r65=HEAP32[(r21<<2>>2)+r10];r64=HEAP32[(r62<<2>>2)+r11];r62=HEAP32[(r21<<2>>2)+r12];r21=HEAPU8[r60+2|0];HEAP8[r56+2|0]=(HEAP8[r65+(r21+r64-r30)|0]+HEAP8[r63+r30+r21|0]&255)+HEAP8[r62+r31+r21|0]&255;r21=HEAPU8[r60+3|0];HEAP8[r56+3|0]=(HEAP8[r65+(r21+r64-r32)|0]+HEAP8[r63+r32+r21|0]&255)+HEAP8[r62+r33+r21|0]&255;r21=HEAPU8[r57+2|0];HEAP8[r55+2|0]=(HEAP8[r65+(r21+r64-r34)|0]+HEAP8[r63+r34+r21|0]&255)+HEAP8[r62+r35+r21|0]&255;r21=HEAPU8[r57+3|0];HEAP8[r55+3|0]=(HEAP8[r65+(r21+r64-r36)|0]+HEAP8[r63+r36+r21|0]&255)+HEAP8[r62+r37+r21|0]&255;r21=HEAPU8[r58+2|0];r62=HEAPU8[r59+2|0];r63=HEAP32[(r62<<2>>2)+r9];r64=HEAP32[(r21<<2>>2)+r10];r65=HEAP32[(r62<<2>>2)+r11];r62=HEAP32[(r21<<2>>2)+r12];r21=HEAPU8[r57+4|0];HEAP8[r55+4|0]=(HEAP8[r64+(r21+r65-r38)|0]+HEAP8[r63+r38+r21|0]&255)+HEAP8[r62+r39+r21|0]&255;r21=HEAPU8[r57+5|0];HEAP8[r55+5|0]=(HEAP8[r64+(r21+r65-r40)|0]+HEAP8[r63+r40+r21|0]&255)+HEAP8[r62+r41+r21|0]&255;r21=HEAPU8[r60+4|0];HEAP8[r56+4|0]=(HEAP8[r64+(r21+r65-r42)|0]+HEAP8[r63+r42+r21|0]&255)+HEAP8[r62+r43+r21|0]&255;r21=HEAPU8[r60+5|0];HEAP8[r56+5|0]=(HEAP8[r64+(r21+r65-r44)|0]+HEAP8[r63+r44+r21|0]&255)+HEAP8[r62+r45+r21|0]&255;r21=HEAPU8[r58+3|0];r62=HEAPU8[r59+3|0];r63=HEAP32[(r62<<2>>2)+r9];r65=HEAP32[(r21<<2>>2)+r10];r64=HEAP32[(r62<<2>>2)+r11];r62=HEAP32[(r21<<2>>2)+r12];r21=HEAPU8[r60+6|0];HEAP8[r56+6|0]=(HEAP8[r65+(r21+r64-r46)|0]+HEAP8[r63+r46+r21|0]&255)+HEAP8[r62+r47+r21|0]&255;r21=HEAPU8[r60+7|0];HEAP8[r56+7|0]=(HEAP8[r65+(r21+r64-r48)|0]+HEAP8[r63+r48+r21|0]&255)+HEAP8[r62+r49+r21|0]&255;r21=HEAPU8[r57+6|0];HEAP8[r55+6|0]=(HEAP8[r65+(r21+r64-r50)|0]+HEAP8[r63+r50+r21|0]&255)+HEAP8[r62+r51+r21|0]&255;r21=HEAPU8[r57+7|0];HEAP8[r55+7|0]=(HEAP8[r65+(r21+r64-r52)|0]+HEAP8[r63+r52+r21|0]&255)+HEAP8[r62+r53+r21|0]&255;r21=r61-1|0;if((r21|0)==0){break}else{r55=r55+8|0;r56=r56+8|0;r57=r57+8|0;r58=r58+4|0;r59=r59+4|0;r60=r60+8|0;r61=r21}}r61=HEAP32[r14>>2];if((r2|0)==0){break}r17=r17+r20+HEAP32[r15>>2]|0;r3=r3+r20+HEAP32[r13>>2]|0;r1=r1+r54+r61|0;r18=r18+r54+r61|0;r2=r2-1|0;r19=HEAP32[r16>>2]+r6|0;r4=HEAP32[r5>>2]}return}function _rgb_c_16_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r4=r1+12|0;r5=HEAP32[r4>>2];r6=r1+8|0;r7=r1+4|0;r8=(r1+60|0)>>2;r9=(r1+1084|0)>>2;r10=(r1+2108|0)>>2;r11=(r1+3132|0)>>2;r12=r1+16|0;r13=r1+20|0;r14=r1+24|0;r15=HEAP32[r1>>2]+Math.imul(r5,r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r16=HEAP32[r2+8>>2];r2=7;r17=r5;while(1){r5=HEAP32[r7>>2];r18=r5<<4;r19=r5<<3;r20=r5<<2;r21=r15+r17|0,r22=r21>>1;r23=r15,r24=r23>>1;r25=r3;r26=r1;r27=r16;r28=r3+HEAP32[r6>>2]|0;r29=r5;while(1){r5=HEAPU8[r26];r30=HEAPU8[r27];r31=HEAP32[(r30<<2>>2)+r8]>>1;r32=(HEAP32[(r5<<2>>2)+r9]+HEAP32[(r30<<2>>2)+r10]|0)>>1;r30=HEAP32[(r5<<2>>2)+r11]>>1;r5=HEAPU8[r25];HEAP16[r24]=(HEAP16[(r5<<1>>1)+r32]+HEAP16[(r5<<1>>1)+r31]&65535)+HEAP16[(r5<<1>>1)+r30]&65535;r5=HEAPU8[r25+1|0];HEAP16[r24+1]=(HEAP16[(r5<<1>>1)+r32]+HEAP16[(r5<<1>>1)+r31]&65535)+HEAP16[(r5<<1>>1)+r30]&65535;r5=HEAPU8[r28];HEAP16[r22]=(HEAP16[(r5<<1>>1)+r32]+HEAP16[(r5<<1>>1)+r31]&65535)+HEAP16[(r5<<1>>1)+r30]&65535;r5=HEAPU8[r28+1|0];HEAP16[r22+1]=(HEAP16[(r5<<1>>1)+r32]+HEAP16[(r5<<1>>1)+r31]&65535)+HEAP16[(r5<<1>>1)+r30]&65535;r30=HEAPU8[r26+1|0];r5=HEAPU8[r27+1|0];r31=HEAP32[(r5<<2>>2)+r8]>>1;r32=(HEAP32[(r30<<2>>2)+r9]+HEAP32[(r5<<2>>2)+r10]|0)>>1;r5=HEAP32[(r30<<2>>2)+r11]>>1;r30=HEAPU8[r28+2|0];HEAP16[r22+2]=(HEAP16[(r30<<1>>1)+r32]+HEAP16[(r30<<1>>1)+r31]&65535)+HEAP16[(r30<<1>>1)+r5]&65535;r30=HEAPU8[r28+3|0];HEAP16[r22+3]=(HEAP16[(r30<<1>>1)+r32]+HEAP16[(r30<<1>>1)+r31]&65535)+HEAP16[(r30<<1>>1)+r5]&65535;r30=HEAPU8[r25+2|0];HEAP16[r24+2]=(HEAP16[(r30<<1>>1)+r32]+HEAP16[(r30<<1>>1)+r31]&65535)+HEAP16[(r30<<1>>1)+r5]&65535;r30=HEAPU8[r25+3|0];HEAP16[r24+3]=(HEAP16[(r30<<1>>1)+r32]+HEAP16[(r30<<1>>1)+r31]&65535)+HEAP16[(r30<<1>>1)+r5]&65535;r5=HEAPU8[r26+2|0];r30=HEAPU8[r27+2|0];r31=HEAP32[(r30<<2>>2)+r8]>>1;r32=(HEAP32[(r5<<2>>2)+r9]+HEAP32[(r30<<2>>2)+r10]|0)>>1;r30=HEAP32[(r5<<2>>2)+r11]>>1;r5=HEAPU8[r25+4|0];HEAP16[r24+4]=(HEAP16[(r5<<1>>1)+r32]+HEAP16[(r5<<1>>1)+r31]&65535)+HEAP16[(r5<<1>>1)+r30]&65535;r5=HEAPU8[r25+5|0];HEAP16[r24+5]=(HEAP16[(r5<<1>>1)+r32]+HEAP16[(r5<<1>>1)+r31]&65535)+HEAP16[(r5<<1>>1)+r30]&65535;r5=HEAPU8[r28+4|0];HEAP16[r22+4]=(HEAP16[(r5<<1>>1)+r32]+HEAP16[(r5<<1>>1)+r31]&65535)+HEAP16[(r5<<1>>1)+r30]&65535;r5=HEAPU8[r28+5|0];HEAP16[r22+5]=(HEAP16[(r5<<1>>1)+r32]+HEAP16[(r5<<1>>1)+r31]&65535)+HEAP16[(r5<<1>>1)+r30]&65535;r30=HEAPU8[r26+3|0];r5=HEAPU8[r27+3|0];r31=HEAP32[(r5<<2>>2)+r8]>>1;r32=(HEAP32[(r30<<2>>2)+r9]+HEAP32[(r5<<2>>2)+r10]|0)>>1;r5=HEAP32[(r30<<2>>2)+r11]>>1;r30=HEAPU8[r28+6|0];HEAP16[r22+6]=(HEAP16[(r30<<1>>1)+r32]+HEAP16[(r30<<1>>1)+r31]&65535)+HEAP16[(r30<<1>>1)+r5]&65535;r30=HEAPU8[r28+7|0];HEAP16[r22+7]=(HEAP16[(r30<<1>>1)+r32]+HEAP16[(r30<<1>>1)+r31]&65535)+HEAP16[(r30<<1>>1)+r5]&65535;r30=HEAPU8[r25+6|0];HEAP16[r24+6]=(HEAP16[(r30<<1>>1)+r32]+HEAP16[(r30<<1>>1)+r31]&65535)+HEAP16[(r30<<1>>1)+r5]&65535;r30=HEAPU8[r25+7|0];HEAP16[r24+7]=(HEAP16[(r30<<1>>1)+r32]+HEAP16[(r30<<1>>1)+r31]&65535)+HEAP16[(r30<<1>>1)+r5]&65535;r5=r29-1|0;if((r5|0)==0){break}else{r21=r21+16|0,r22=r21>>1;r23=r23+16|0,r24=r23>>1;r25=r25+8|0;r26=r26+4|0;r27=r27+4|0;r28=r28+8|0;r29=r5}}r29=HEAP32[r13>>2];if((r2|0)==0){break}r15=r15+r18+HEAP32[r14>>2]|0;r3=r3+r19+HEAP32[r12>>2]|0;r1=r1+r20+r29|0;r16=r16+r20+r29|0;r2=r2-1|0;r17=HEAP32[r4>>2]}return}function _rgb_c_24_rgb_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r4=r1+12|0;r5=HEAP32[r4>>2];r6=r1+8|0;r7=r1+4|0;r8=(r1+60|0)>>2;r9=(r1+1084|0)>>2;r10=(r1+2108|0)>>2;r11=(r1+3132|0)>>2;r12=r1+16|0;r13=r1+20|0;r14=r1+24|0;r15=HEAP32[r1>>2]+Math.imul(r5,r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r16=HEAP32[r2+8>>2];r2=7;r17=r5;while(1){r5=HEAP32[r7>>2];r18=r5*24&-1;r19=r5<<3;r20=r5<<2;r21=r15+r17|0;r22=r15;r23=r3;r24=r1;r25=r16;r26=r3+HEAP32[r6>>2]|0;r27=r5;while(1){r5=HEAPU8[r24];r28=HEAPU8[r25];r29=HEAP32[(r28<<2>>2)+r8];r30=HEAP32[(r5<<2>>2)+r9];r31=HEAP32[(r28<<2>>2)+r10];r28=HEAP32[(r5<<2>>2)+r11];r5=HEAPU8[r23];HEAP8[r22]=HEAP8[r29+r5|0];HEAP8[r22+1|0]=HEAP8[r30+r5+r31|0];HEAP8[r22+2|0]=HEAP8[r28+r5|0];r5=HEAPU8[r23+1|0];HEAP8[r22+3|0]=HEAP8[r29+r5|0];HEAP8[r22+4|0]=HEAP8[r30+r5+r31|0];HEAP8[r22+5|0]=HEAP8[r28+r5|0];r5=HEAPU8[r26];HEAP8[r21]=HEAP8[r29+r5|0];HEAP8[r21+1|0]=HEAP8[r30+r5+r31|0];HEAP8[r21+2|0]=HEAP8[r28+r5|0];r5=HEAPU8[r26+1|0];HEAP8[r21+3|0]=HEAP8[r29+r5|0];HEAP8[r21+4|0]=HEAP8[r30+r5+r31|0];HEAP8[r21+5|0]=HEAP8[r28+r5|0];r5=HEAPU8[r24+1|0];r28=HEAPU8[r25+1|0];r31=HEAP32[(r28<<2>>2)+r8];r30=HEAP32[(r5<<2>>2)+r9];r29=HEAP32[(r28<<2>>2)+r10];r28=HEAP32[(r5<<2>>2)+r11];r5=HEAPU8[r26+2|0];HEAP8[r21+6|0]=HEAP8[r31+r5|0];HEAP8[r21+7|0]=HEAP8[r30+r5+r29|0];HEAP8[r21+8|0]=HEAP8[r28+r5|0];r5=HEAPU8[r26+3|0];HEAP8[r21+9|0]=HEAP8[r31+r5|0];HEAP8[r21+10|0]=HEAP8[r30+r5+r29|0];HEAP8[r21+11|0]=HEAP8[r28+r5|0];r5=HEAPU8[r23+2|0];HEAP8[r22+6|0]=HEAP8[r31+r5|0];HEAP8[r22+7|0]=HEAP8[r30+r5+r29|0];HEAP8[r22+8|0]=HEAP8[r28+r5|0];r5=HEAPU8[r23+3|0];HEAP8[r22+9|0]=HEAP8[r31+r5|0];HEAP8[r22+10|0]=HEAP8[r30+r5+r29|0];HEAP8[r22+11|0]=HEAP8[r28+r5|0];r5=HEAPU8[r24+2|0];r28=HEAPU8[r25+2|0];r29=HEAP32[(r28<<2>>2)+r8];r30=HEAP32[(r5<<2>>2)+r9];r31=HEAP32[(r28<<2>>2)+r10];r28=HEAP32[(r5<<2>>2)+r11];r5=HEAPU8[r23+4|0];HEAP8[r22+12|0]=HEAP8[r29+r5|0];HEAP8[r22+13|0]=HEAP8[r30+r5+r31|0];HEAP8[r22+14|0]=HEAP8[r28+r5|0];r5=HEAPU8[r23+5|0];HEAP8[r22+15|0]=HEAP8[r29+r5|0];HEAP8[r22+16|0]=HEAP8[r30+r5+r31|0];HEAP8[r22+17|0]=HEAP8[r28+r5|0];r5=HEAPU8[r26+4|0];HEAP8[r21+12|0]=HEAP8[r29+r5|0];HEAP8[r21+13|0]=HEAP8[r30+r5+r31|0];HEAP8[r21+14|0]=HEAP8[r28+r5|0];r5=HEAPU8[r26+5|0];HEAP8[r21+15|0]=HEAP8[r29+r5|0];HEAP8[r21+16|0]=HEAP8[r30+r5+r31|0];HEAP8[r21+17|0]=HEAP8[r28+r5|0];r5=HEAPU8[r24+3|0];r28=HEAPU8[r25+3|0];r31=HEAP32[(r28<<2>>2)+r8];r30=HEAP32[(r5<<2>>2)+r9];r29=HEAP32[(r28<<2>>2)+r10];r28=HEAP32[(r5<<2>>2)+r11];r5=HEAPU8[r26+6|0];HEAP8[r21+18|0]=HEAP8[r31+r5|0];HEAP8[r21+19|0]=HEAP8[r30+r5+r29|0];HEAP8[r21+20|0]=HEAP8[r28+r5|0];r5=HEAPU8[r26+7|0];HEAP8[r21+21|0]=HEAP8[r31+r5|0];HEAP8[r21+22|0]=HEAP8[r30+r5+r29|0];HEAP8[r21+23|0]=HEAP8[r28+r5|0];r5=HEAPU8[r23+6|0];HEAP8[r22+18|0]=HEAP8[r31+r5|0];HEAP8[r22+19|0]=HEAP8[r30+r5+r29|0];HEAP8[r22+20|0]=HEAP8[r28+r5|0];r5=HEAPU8[r23+7|0];HEAP8[r22+21|0]=HEAP8[r31+r5|0];HEAP8[r22+22|0]=HEAP8[r30+r5+r29|0];HEAP8[r22+23|0]=HEAP8[r28+r5|0];r5=r27-1|0;if((r5|0)==0){break}else{r21=r21+24|0;r22=r22+24|0;r23=r23+8|0;r24=r24+4|0;r25=r25+4|0;r26=r26+8|0;r27=r5}}r27=HEAP32[r13>>2];if((r2|0)==0){break}r15=r15+r18+HEAP32[r14>>2]|0;r3=r3+r19+HEAP32[r12>>2]|0;r1=r1+r20+r27|0;r16=r16+r20+r27|0;r2=r2-1|0;r17=HEAP32[r4>>2]}return}function _rgb_c_32_420(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r4=r1+12|0;r5=HEAP32[r4>>2];r6=r1+8|0;r7=r1+4|0;r8=(r1+60|0)>>2;r9=(r1+1084|0)>>2;r10=(r1+2108|0)>>2;r11=(r1+3132|0)>>2;r12=r1+16|0;r13=r1+20|0;r14=r1+24|0;r15=HEAP32[r1>>2]+Math.imul(r5,r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r16=HEAP32[r2+8>>2];r2=7;r17=r5;while(1){r5=HEAP32[r7>>2];r18=r5<<5;r19=r5<<3;r20=r5<<2;r21=r15+r17|0,r22=r21>>2;r23=r15,r24=r23>>2;r25=r3;r26=r1;r27=r16;r28=r3+HEAP32[r6>>2]|0;r29=r5;while(1){r5=HEAPU8[r26];r30=HEAPU8[r27];r31=HEAP32[(r30<<2>>2)+r8]>>2;r32=(HEAP32[(r5<<2>>2)+r9]+HEAP32[(r30<<2>>2)+r10]|0)>>2;r30=HEAP32[(r5<<2>>2)+r11]>>2;r5=HEAPU8[r25];HEAP32[r24]=HEAP32[(r5<<2>>2)+r32]+HEAP32[(r5<<2>>2)+r31]+HEAP32[(r5<<2>>2)+r30]|0;r5=HEAPU8[r25+1|0];HEAP32[r24+1]=HEAP32[(r5<<2>>2)+r32]+HEAP32[(r5<<2>>2)+r31]+HEAP32[(r5<<2>>2)+r30]|0;r5=HEAPU8[r28];HEAP32[r22]=HEAP32[(r5<<2>>2)+r32]+HEAP32[(r5<<2>>2)+r31]+HEAP32[(r5<<2>>2)+r30]|0;r5=HEAPU8[r28+1|0];HEAP32[r22+1]=HEAP32[(r5<<2>>2)+r32]+HEAP32[(r5<<2>>2)+r31]+HEAP32[(r5<<2>>2)+r30]|0;r30=HEAPU8[r26+1|0];r5=HEAPU8[r27+1|0];r31=HEAP32[(r5<<2>>2)+r8]>>2;r32=(HEAP32[(r30<<2>>2)+r9]+HEAP32[(r5<<2>>2)+r10]|0)>>2;r5=HEAP32[(r30<<2>>2)+r11]>>2;r30=HEAPU8[r28+2|0];HEAP32[r22+2]=HEAP32[(r30<<2>>2)+r32]+HEAP32[(r30<<2>>2)+r31]+HEAP32[(r30<<2>>2)+r5]|0;r30=HEAPU8[r28+3|0];HEAP32[r22+3]=HEAP32[(r30<<2>>2)+r32]+HEAP32[(r30<<2>>2)+r31]+HEAP32[(r30<<2>>2)+r5]|0;r30=HEAPU8[r25+2|0];HEAP32[r24+2]=HEAP32[(r30<<2>>2)+r32]+HEAP32[(r30<<2>>2)+r31]+HEAP32[(r30<<2>>2)+r5]|0;r30=HEAPU8[r25+3|0];HEAP32[r24+3]=HEAP32[(r30<<2>>2)+r32]+HEAP32[(r30<<2>>2)+r31]+HEAP32[(r30<<2>>2)+r5]|0;r5=HEAPU8[r26+2|0];r30=HEAPU8[r27+2|0];r31=HEAP32[(r30<<2>>2)+r8]>>2;r32=(HEAP32[(r5<<2>>2)+r9]+HEAP32[(r30<<2>>2)+r10]|0)>>2;r30=HEAP32[(r5<<2>>2)+r11]>>2;r5=HEAPU8[r25+4|0];HEAP32[r24+4]=HEAP32[(r5<<2>>2)+r32]+HEAP32[(r5<<2>>2)+r31]+HEAP32[(r5<<2>>2)+r30]|0;r5=HEAPU8[r25+5|0];HEAP32[r24+5]=HEAP32[(r5<<2>>2)+r32]+HEAP32[(r5<<2>>2)+r31]+HEAP32[(r5<<2>>2)+r30]|0;r5=HEAPU8[r28+4|0];HEAP32[r22+4]=HEAP32[(r5<<2>>2)+r32]+HEAP32[(r5<<2>>2)+r31]+HEAP32[(r5<<2>>2)+r30]|0;r5=HEAPU8[r28+5|0];HEAP32[r22+5]=HEAP32[(r5<<2>>2)+r32]+HEAP32[(r5<<2>>2)+r31]+HEAP32[(r5<<2>>2)+r30]|0;r30=HEAPU8[r26+3|0];r5=HEAPU8[r27+3|0];r31=HEAP32[(r5<<2>>2)+r8]>>2;r32=(HEAP32[(r30<<2>>2)+r9]+HEAP32[(r5<<2>>2)+r10]|0)>>2;r5=HEAP32[(r30<<2>>2)+r11]>>2;r30=HEAPU8[r28+6|0];HEAP32[r22+6]=HEAP32[(r30<<2>>2)+r32]+HEAP32[(r30<<2>>2)+r31]+HEAP32[(r30<<2>>2)+r5]|0;r30=HEAPU8[r28+7|0];HEAP32[r22+7]=HEAP32[(r30<<2>>2)+r32]+HEAP32[(r30<<2>>2)+r31]+HEAP32[(r30<<2>>2)+r5]|0;r30=HEAPU8[r25+6|0];HEAP32[r24+6]=HEAP32[(r30<<2>>2)+r32]+HEAP32[(r30<<2>>2)+r31]+HEAP32[(r30<<2>>2)+r5]|0;r30=HEAPU8[r25+7|0];HEAP32[r24+7]=HEAP32[(r30<<2>>2)+r32]+HEAP32[(r30<<2>>2)+r31]+HEAP32[(r30<<2>>2)+r5]|0;r5=r29-1|0;if((r5|0)==0){break}else{r21=r21+32|0,r22=r21>>2;r23=r23+32|0,r24=r23>>2;r25=r25+8|0;r26=r26+4|0;r27=r27+4|0;r28=r28+8|0;r29=r5}}r29=HEAP32[r13>>2];if((r2|0)==0){break}r15=r15+r18+HEAP32[r14>>2]|0;r3=r3+r19+HEAP32[r12>>2]|0;r1=r1+r20+r29|0;r16=r16+r20+r29|0;r2=r2-1|0;r17=HEAP32[r4>>2]}return}function _rgb_c_24_bgr_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r4=r1+4|0;r5=(r1+60|0)>>2;r6=(r1+1084|0)>>2;r7=(r1+2108|0)>>2;r8=(r1+3132|0)>>2;r9=r1+16|0;r10=r1+20|0;r11=r1+24|0;r12=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r13=HEAP32[r2+8>>2];r2=16;while(1){r14=HEAP32[r4>>2];r15=r14*24&-1;r16=r14<<3;r17=r14<<2;r18=r12;r19=r3;r20=r1;r21=r13;r22=r14;while(1){r14=HEAPU8[r20];r23=HEAPU8[r21];r24=HEAP32[(r23<<2>>2)+r5];r25=HEAP32[(r14<<2>>2)+r6];r26=HEAP32[(r23<<2>>2)+r7];r23=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r19];HEAP8[r18]=HEAP8[r23+r14|0];HEAP8[r18+1|0]=HEAP8[r25+r14+r26|0];HEAP8[r18+2|0]=HEAP8[r24+r14|0];r14=HEAPU8[r19+1|0];HEAP8[r18+3|0]=HEAP8[r23+r14|0];HEAP8[r18+4|0]=HEAP8[r25+r14+r26|0];HEAP8[r18+5|0]=HEAP8[r24+r14|0];r14=HEAPU8[r20+1|0];r24=HEAPU8[r21+1|0];r26=HEAP32[(r24<<2>>2)+r5];r25=HEAP32[(r14<<2>>2)+r6];r23=HEAP32[(r24<<2>>2)+r7];r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r19+2|0];HEAP8[r18+6|0]=HEAP8[r24+r14|0];HEAP8[r18+7|0]=HEAP8[r25+r14+r23|0];HEAP8[r18+8|0]=HEAP8[r26+r14|0];r14=HEAPU8[r19+3|0];HEAP8[r18+9|0]=HEAP8[r24+r14|0];HEAP8[r18+10|0]=HEAP8[r25+r14+r23|0];HEAP8[r18+11|0]=HEAP8[r26+r14|0];r14=HEAPU8[r20+2|0];r26=HEAPU8[r21+2|0];r23=HEAP32[(r26<<2>>2)+r5];r25=HEAP32[(r14<<2>>2)+r6];r24=HEAP32[(r26<<2>>2)+r7];r26=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r19+4|0];HEAP8[r18+12|0]=HEAP8[r26+r14|0];HEAP8[r18+13|0]=HEAP8[r25+r14+r24|0];HEAP8[r18+14|0]=HEAP8[r23+r14|0];r14=HEAPU8[r19+5|0];HEAP8[r18+15|0]=HEAP8[r26+r14|0];HEAP8[r18+16|0]=HEAP8[r25+r14+r24|0];HEAP8[r18+17|0]=HEAP8[r23+r14|0];r14=HEAPU8[r20+3|0];r23=HEAPU8[r21+3|0];r24=HEAP32[(r23<<2>>2)+r5];r25=HEAP32[(r14<<2>>2)+r6];r26=HEAP32[(r23<<2>>2)+r7];r23=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r19+6|0];HEAP8[r18+18|0]=HEAP8[r23+r14|0];HEAP8[r18+19|0]=HEAP8[r25+r14+r26|0];HEAP8[r18+20|0]=HEAP8[r24+r14|0];r14=HEAPU8[r19+7|0];HEAP8[r18+21|0]=HEAP8[r23+r14|0];HEAP8[r18+22|0]=HEAP8[r25+r14+r26|0];HEAP8[r18+23|0]=HEAP8[r24+r14|0];r14=r22-1|0;if((r14|0)==0){break}else{r18=r18+24|0;r19=r19+8|0;r20=r20+4|0;r21=r21+4|0;r22=r14}}r22=HEAP32[r10>>2];r21=r2-1|0;if((r21|0)==0){break}else{r12=r12+r15+HEAP32[r11>>2]|0;r3=r3+r16+HEAP32[r9>>2]|0;r1=r1+r17+r22|0;r13=r13+r17+r22|0;r2=r21}}return}function _rgb_c_8_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44;r4=HEAP32[r1+36>>2];r5=r1+4|0;r6=(r1+60|0)>>2;r7=(r1+1084|0)>>2;r8=(r1+2108|0)>>2;r9=(r1+3132|0)>>2;r10=r1+16|0;r11=r1+20|0;r12=r1+24|0;r13=r1+40|0;r14=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r15=HEAP32[r2+8>>2];r2=16;r16=r4;while(1){r4=r16&255;r17=r4<<1;r18=HEAP32[r5>>2];r19=HEAPU8[r17+5251516|0];r20=HEAPU8[(r17|1)+5251516|0];r21=HEAPU8[r17+5251518|0];r22=HEAPU8[r17+5251519|0];r23=HEAPU8[r17+5251520|0];r24=HEAPU8[r17+5251521|0];r25=HEAPU8[r17+5251522|0];r26=HEAPU8[r17+5251523|0];r27=HEAPU8[r17+5251524|0];r28=HEAPU8[r17+5251525|0];r29=HEAPU8[r17+5251526|0];r30=HEAPU8[r17+5251527|0];r31=HEAPU8[r17+5251528|0];r32=HEAPU8[r17+5251529|0];r33=HEAPU8[r17+5251530|0];r34=HEAPU8[r17+5251531|0];r17=r18<<3;r35=r18<<2;r36=r14;r37=r3;r38=r1;r39=r15;r40=r18;while(1){r18=HEAPU8[r38];r41=HEAPU8[r39];r42=HEAP32[(r41<<2>>2)+r6];r43=HEAP32[(r18<<2>>2)+r7];r44=HEAP32[(r41<<2>>2)+r8];r41=HEAP32[(r18<<2>>2)+r9];r18=HEAPU8[r37];HEAP8[r36]=(HEAP8[r43+(r18+r44-r19)|0]+HEAP8[r42+r19+r18|0]&255)+HEAP8[r41+r20+r18|0]&255;r18=HEAPU8[r37+1|0];HEAP8[r36+1|0]=(HEAP8[r43+(r18+r44-r21)|0]+HEAP8[r42+r21+r18|0]&255)+HEAP8[r41+r22+r18|0]&255;r18=HEAPU8[r38+1|0];r41=HEAPU8[r39+1|0];r42=HEAP32[(r41<<2>>2)+r6];r44=HEAP32[(r18<<2>>2)+r7];r43=HEAP32[(r41<<2>>2)+r8];r41=HEAP32[(r18<<2>>2)+r9];r18=HEAPU8[r37+2|0];HEAP8[r36+2|0]=(HEAP8[r44+(r18+r43-r23)|0]+HEAP8[r42+r23+r18|0]&255)+HEAP8[r41+r24+r18|0]&255;r18=HEAPU8[r37+3|0];HEAP8[r36+3|0]=(HEAP8[r44+(r18+r43-r25)|0]+HEAP8[r42+r25+r18|0]&255)+HEAP8[r41+r26+r18|0]&255;r18=HEAPU8[r38+2|0];r41=HEAPU8[r39+2|0];r42=HEAP32[(r41<<2>>2)+r6];r43=HEAP32[(r18<<2>>2)+r7];r44=HEAP32[(r41<<2>>2)+r8];r41=HEAP32[(r18<<2>>2)+r9];r18=HEAPU8[r37+4|0];HEAP8[r36+4|0]=(HEAP8[r43+(r18+r44-r27)|0]+HEAP8[r42+r27+r18|0]&255)+HEAP8[r41+r28+r18|0]&255;r18=HEAPU8[r37+5|0];HEAP8[r36+5|0]=(HEAP8[r43+(r18+r44-r29)|0]+HEAP8[r42+r29+r18|0]&255)+HEAP8[r41+r30+r18|0]&255;r18=HEAPU8[r38+3|0];r41=HEAPU8[r39+3|0];r42=HEAP32[(r41<<2>>2)+r6];r44=HEAP32[(r18<<2>>2)+r7];r43=HEAP32[(r41<<2>>2)+r8];r41=HEAP32[(r18<<2>>2)+r9];r18=HEAPU8[r37+6|0];HEAP8[r36+6|0]=(HEAP8[r44+(r18+r43-r31)|0]+HEAP8[r42+r31+r18|0]&255)+HEAP8[r41+r32+r18|0]&255;r18=HEAPU8[r37+7|0];HEAP8[r36+7|0]=(HEAP8[r44+(r18+r43-r33)|0]+HEAP8[r42+r33+r18|0]&255)+HEAP8[r41+r34+r18|0]&255;r18=r40-1|0;if((r18|0)==0){break}else{r36=r36+8|0;r37=r37+8|0;r38=r38+4|0;r39=r39+4|0;r40=r18}}r40=HEAP32[r11>>2];r39=r2-1|0;if((r39|0)==0){break}else{r14=r14+r17+HEAP32[r12>>2]|0;r3=r3+r17+HEAP32[r10>>2]|0;r1=r1+r35+r40|0;r15=r15+r35+r40|0;r2=r39;r16=HEAP32[r13>>2]+r4|0}}return}function _rgb_c_16_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r4=r1+4|0;r5=(r1+60|0)>>2;r6=(r1+1084|0)>>2;r7=(r1+2108|0)>>2;r8=(r1+3132|0)>>2;r9=r1+16|0;r10=r1+20|0;r11=r1+24|0;r12=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r13=HEAP32[r2+8>>2];r2=16;while(1){r14=HEAP32[r4>>2];r15=r14<<4;r16=r14<<3;r17=r14<<2;r18=r12,r19=r18>>1;r20=r3;r21=r1;r22=r13;r23=r14;while(1){r14=HEAPU8[r21];r24=HEAPU8[r22];r25=HEAP32[(r24<<2>>2)+r5];r26=HEAP32[(r14<<2>>2)+r6]+HEAP32[(r24<<2>>2)+r7]|0;r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r20];HEAP16[r19]=(HEAP16[r26+(r14<<1)>>1]+HEAP16[r25+(r14<<1)>>1]&65535)+HEAP16[r24+(r14<<1)>>1]&65535;r14=HEAPU8[r20+1|0];HEAP16[r19+1]=(HEAP16[r26+(r14<<1)>>1]+HEAP16[r25+(r14<<1)>>1]&65535)+HEAP16[r24+(r14<<1)>>1]&65535;r14=HEAPU8[r21+1|0];r24=HEAPU8[r22+1|0];r25=HEAP32[(r24<<2>>2)+r5];r26=HEAP32[(r14<<2>>2)+r6]+HEAP32[(r24<<2>>2)+r7]|0;r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r20+2|0];HEAP16[r19+2]=(HEAP16[r26+(r14<<1)>>1]+HEAP16[r25+(r14<<1)>>1]&65535)+HEAP16[r24+(r14<<1)>>1]&65535;r14=HEAPU8[r20+3|0];HEAP16[r19+3]=(HEAP16[r26+(r14<<1)>>1]+HEAP16[r25+(r14<<1)>>1]&65535)+HEAP16[r24+(r14<<1)>>1]&65535;r14=HEAPU8[r21+2|0];r24=HEAPU8[r22+2|0];r25=HEAP32[(r24<<2>>2)+r5];r26=HEAP32[(r14<<2>>2)+r6]+HEAP32[(r24<<2>>2)+r7]|0;r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r20+4|0];HEAP16[r19+4]=(HEAP16[r26+(r14<<1)>>1]+HEAP16[r25+(r14<<1)>>1]&65535)+HEAP16[r24+(r14<<1)>>1]&65535;r14=HEAPU8[r20+5|0];HEAP16[r19+5]=(HEAP16[r26+(r14<<1)>>1]+HEAP16[r25+(r14<<1)>>1]&65535)+HEAP16[r24+(r14<<1)>>1]&65535;r14=HEAPU8[r21+3|0];r24=HEAPU8[r22+3|0];r25=HEAP32[(r24<<2>>2)+r5];r26=HEAP32[(r14<<2>>2)+r6]+HEAP32[(r24<<2>>2)+r7]|0;r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r20+6|0];HEAP16[r19+6]=(HEAP16[r26+(r14<<1)>>1]+HEAP16[r25+(r14<<1)>>1]&65535)+HEAP16[r24+(r14<<1)>>1]&65535;r14=HEAPU8[r20+7|0];HEAP16[r19+7]=(HEAP16[r26+(r14<<1)>>1]+HEAP16[r25+(r14<<1)>>1]&65535)+HEAP16[r24+(r14<<1)>>1]&65535;r14=r23-1|0;if((r14|0)==0){break}else{r18=r18+16|0,r19=r18>>1;r20=r20+8|0;r21=r21+4|0;r22=r22+4|0;r23=r14}}r23=HEAP32[r10>>2];r22=r2-1|0;if((r22|0)==0){break}else{r12=r12+r15+HEAP32[r11>>2]|0;r3=r3+r16+HEAP32[r9>>2]|0;r1=r1+r17+r23|0;r13=r13+r17+r23|0;r2=r22}}return}function _rgb_c_24_rgb_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r4=r1+4|0;r5=(r1+60|0)>>2;r6=(r1+1084|0)>>2;r7=(r1+2108|0)>>2;r8=(r1+3132|0)>>2;r9=r1+16|0;r10=r1+20|0;r11=r1+24|0;r12=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r13=HEAP32[r2+8>>2];r2=16;while(1){r14=HEAP32[r4>>2];r15=r14*24&-1;r16=r14<<3;r17=r14<<2;r18=r12;r19=r3;r20=r1;r21=r13;r22=r14;while(1){r14=HEAPU8[r20];r23=HEAPU8[r21];r24=HEAP32[(r23<<2>>2)+r5];r25=HEAP32[(r14<<2>>2)+r6];r26=HEAP32[(r23<<2>>2)+r7];r23=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r19];HEAP8[r18]=HEAP8[r24+r14|0];HEAP8[r18+1|0]=HEAP8[r25+r14+r26|0];HEAP8[r18+2|0]=HEAP8[r23+r14|0];r14=HEAPU8[r19+1|0];HEAP8[r18+3|0]=HEAP8[r24+r14|0];HEAP8[r18+4|0]=HEAP8[r25+r14+r26|0];HEAP8[r18+5|0]=HEAP8[r23+r14|0];r14=HEAPU8[r20+1|0];r23=HEAPU8[r21+1|0];r26=HEAP32[(r23<<2>>2)+r5];r25=HEAP32[(r14<<2>>2)+r6];r24=HEAP32[(r23<<2>>2)+r7];r23=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r19+2|0];HEAP8[r18+6|0]=HEAP8[r26+r14|0];HEAP8[r18+7|0]=HEAP8[r25+r14+r24|0];HEAP8[r18+8|0]=HEAP8[r23+r14|0];r14=HEAPU8[r19+3|0];HEAP8[r18+9|0]=HEAP8[r26+r14|0];HEAP8[r18+10|0]=HEAP8[r25+r14+r24|0];HEAP8[r18+11|0]=HEAP8[r23+r14|0];r14=HEAPU8[r20+2|0];r23=HEAPU8[r21+2|0];r24=HEAP32[(r23<<2>>2)+r5];r25=HEAP32[(r14<<2>>2)+r6];r26=HEAP32[(r23<<2>>2)+r7];r23=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r19+4|0];HEAP8[r18+12|0]=HEAP8[r24+r14|0];HEAP8[r18+13|0]=HEAP8[r25+r14+r26|0];HEAP8[r18+14|0]=HEAP8[r23+r14|0];r14=HEAPU8[r19+5|0];HEAP8[r18+15|0]=HEAP8[r24+r14|0];HEAP8[r18+16|0]=HEAP8[r25+r14+r26|0];HEAP8[r18+17|0]=HEAP8[r23+r14|0];r14=HEAPU8[r20+3|0];r23=HEAPU8[r21+3|0];r26=HEAP32[(r23<<2>>2)+r5];r25=HEAP32[(r14<<2>>2)+r6];r24=HEAP32[(r23<<2>>2)+r7];r23=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r19+6|0];HEAP8[r18+18|0]=HEAP8[r26+r14|0];HEAP8[r18+19|0]=HEAP8[r25+r14+r24|0];HEAP8[r18+20|0]=HEAP8[r23+r14|0];r14=HEAPU8[r19+7|0];HEAP8[r18+21|0]=HEAP8[r26+r14|0];HEAP8[r18+22|0]=HEAP8[r25+r14+r24|0];HEAP8[r18+23|0]=HEAP8[r23+r14|0];r14=r22-1|0;if((r14|0)==0){break}else{r18=r18+24|0;r19=r19+8|0;r20=r20+4|0;r21=r21+4|0;r22=r14}}r22=HEAP32[r10>>2];r21=r2-1|0;if((r21|0)==0){break}else{r12=r12+r15+HEAP32[r11>>2]|0;r3=r3+r16+HEAP32[r9>>2]|0;r1=r1+r17+r22|0;r13=r13+r17+r22|0;r2=r21}}return}function _rgb_c_32_422(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r4=r1+4|0;r5=(r1+60|0)>>2;r6=(r1+1084|0)>>2;r7=(r1+2108|0)>>2;r8=(r1+3132|0)>>2;r9=r1+16|0;r10=r1+20|0;r11=r1+24|0;r12=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r13=HEAP32[r2+8>>2];r2=16;while(1){r14=HEAP32[r4>>2];r15=r14<<5;r16=r14<<3;r17=r14<<2;r18=r12,r19=r18>>2;r20=r3;r21=r1;r22=r13;r23=r14;while(1){r14=HEAPU8[r21];r24=HEAPU8[r22];r25=HEAP32[(r24<<2>>2)+r5];r26=HEAP32[(r14<<2>>2)+r6]+HEAP32[(r24<<2>>2)+r7]|0;r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r20];HEAP32[r19]=HEAP32[r26+(r14<<2)>>2]+HEAP32[r25+(r14<<2)>>2]+HEAP32[r24+(r14<<2)>>2]|0;r14=HEAPU8[r20+1|0];HEAP32[r19+1]=HEAP32[r26+(r14<<2)>>2]+HEAP32[r25+(r14<<2)>>2]+HEAP32[r24+(r14<<2)>>2]|0;r14=HEAPU8[r21+1|0];r24=HEAPU8[r22+1|0];r25=HEAP32[(r24<<2>>2)+r5];r26=HEAP32[(r14<<2>>2)+r6]+HEAP32[(r24<<2>>2)+r7]|0;r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r20+2|0];HEAP32[r19+2]=HEAP32[r26+(r14<<2)>>2]+HEAP32[r25+(r14<<2)>>2]+HEAP32[r24+(r14<<2)>>2]|0;r14=HEAPU8[r20+3|0];HEAP32[r19+3]=HEAP32[r26+(r14<<2)>>2]+HEAP32[r25+(r14<<2)>>2]+HEAP32[r24+(r14<<2)>>2]|0;r14=HEAPU8[r21+2|0];r24=HEAPU8[r22+2|0];r25=HEAP32[(r24<<2>>2)+r5];r26=HEAP32[(r14<<2>>2)+r6]+HEAP32[(r24<<2>>2)+r7]|0;r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r20+4|0];HEAP32[r19+4]=HEAP32[r26+(r14<<2)>>2]+HEAP32[r25+(r14<<2)>>2]+HEAP32[r24+(r14<<2)>>2]|0;r14=HEAPU8[r20+5|0];HEAP32[r19+5]=HEAP32[r26+(r14<<2)>>2]+HEAP32[r25+(r14<<2)>>2]+HEAP32[r24+(r14<<2)>>2]|0;r14=HEAPU8[r21+3|0];r24=HEAPU8[r22+3|0];r25=HEAP32[(r24<<2>>2)+r5];r26=HEAP32[(r14<<2>>2)+r6]+HEAP32[(r24<<2>>2)+r7]|0;r24=HEAP32[(r14<<2>>2)+r8];r14=HEAPU8[r20+6|0];HEAP32[r19+6]=HEAP32[r26+(r14<<2)>>2]+HEAP32[r25+(r14<<2)>>2]+HEAP32[r24+(r14<<2)>>2]|0;r14=HEAPU8[r20+7|0];HEAP32[r19+7]=HEAP32[r26+(r14<<2)>>2]+HEAP32[r25+(r14<<2)>>2]+HEAP32[r24+(r14<<2)>>2]|0;r14=r23-1|0;if((r14|0)==0){break}else{r18=r18+32|0,r19=r18>>2;r20=r20+8|0;r21=r21+4|0;r22=r22+4|0;r23=r14}}r23=HEAP32[r10>>2];r22=r2-1|0;if((r22|0)==0){break}else{r12=r12+r15+HEAP32[r11>>2]|0;r3=r3+r16+HEAP32[r9>>2]|0;r1=r1+r17+r23|0;r13=r13+r17+r23|0;r2=r22}}return}function _rgb_c_24_bgr_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r4=r1+4|0;r5=(r1+60|0)>>2;r6=(r1+1084|0)>>2;r7=(r1+2108|0)>>2;r8=(r1+3132|0)>>2;r9=r1+16|0;r10=r1+24|0;r11=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r12=HEAP32[r2+8>>2];r2=16;while(1){r13=HEAP32[r4>>2];r14=r13*24&-1;r15=r13<<3;r16=r11;r17=r3;r18=r1;r19=r12;r20=r13;while(1){r13=HEAPU8[r18];r21=HEAPU8[r19];r22=HEAP32[(r21<<2>>2)+r5];r23=HEAP32[(r13<<2>>2)+r6];r24=HEAP32[(r21<<2>>2)+r7];r21=HEAPU8[r17];HEAP8[r16]=HEAP8[HEAP32[(r13<<2>>2)+r8]+r21|0];HEAP8[r16+1|0]=HEAP8[r23+r21+r24|0];HEAP8[r16+2|0]=HEAP8[r22+r21|0];r21=HEAPU8[r18+1|0];r22=HEAPU8[r19+1|0];r24=HEAP32[(r22<<2>>2)+r5];r23=HEAP32[(r21<<2>>2)+r6];r13=HEAP32[(r22<<2>>2)+r7];r22=HEAPU8[r17+1|0];HEAP8[r16+3|0]=HEAP8[HEAP32[(r21<<2>>2)+r8]+r22|0];HEAP8[r16+4|0]=HEAP8[r23+r22+r13|0];HEAP8[r16+5|0]=HEAP8[r24+r22|0];r22=HEAPU8[r18+2|0];r24=HEAPU8[r19+2|0];r13=HEAP32[(r24<<2>>2)+r5];r23=HEAP32[(r22<<2>>2)+r6];r21=HEAP32[(r24<<2>>2)+r7];r24=HEAPU8[r17+2|0];HEAP8[r16+6|0]=HEAP8[HEAP32[(r22<<2>>2)+r8]+r24|0];HEAP8[r16+7|0]=HEAP8[r23+r24+r21|0];HEAP8[r16+8|0]=HEAP8[r13+r24|0];r24=HEAPU8[r18+3|0];r13=HEAPU8[r19+3|0];r21=HEAP32[(r13<<2>>2)+r5];r23=HEAP32[(r24<<2>>2)+r6];r22=HEAP32[(r13<<2>>2)+r7];r13=HEAPU8[r17+3|0];HEAP8[r16+9|0]=HEAP8[HEAP32[(r24<<2>>2)+r8]+r13|0];HEAP8[r16+10|0]=HEAP8[r23+r13+r22|0];HEAP8[r16+11|0]=HEAP8[r21+r13|0];r13=HEAPU8[r18+4|0];r21=HEAPU8[r19+4|0];r22=HEAP32[(r21<<2>>2)+r5];r23=HEAP32[(r13<<2>>2)+r6];r24=HEAP32[(r21<<2>>2)+r7];r21=HEAPU8[r17+4|0];HEAP8[r16+12|0]=HEAP8[HEAP32[(r13<<2>>2)+r8]+r21|0];HEAP8[r16+13|0]=HEAP8[r23+r21+r24|0];HEAP8[r16+14|0]=HEAP8[r22+r21|0];r21=HEAPU8[r18+5|0];r22=HEAPU8[r19+5|0];r24=HEAP32[(r22<<2>>2)+r5];r23=HEAP32[(r21<<2>>2)+r6];r13=HEAP32[(r22<<2>>2)+r7];r22=HEAPU8[r17+5|0];HEAP8[r16+15|0]=HEAP8[HEAP32[(r21<<2>>2)+r8]+r22|0];HEAP8[r16+16|0]=HEAP8[r23+r22+r13|0];HEAP8[r16+17|0]=HEAP8[r24+r22|0];r22=HEAPU8[r18+6|0];r24=HEAPU8[r19+6|0];r13=HEAP32[(r24<<2>>2)+r5];r23=HEAP32[(r22<<2>>2)+r6];r21=HEAP32[(r24<<2>>2)+r7];r24=HEAPU8[r17+6|0];HEAP8[r16+18|0]=HEAP8[HEAP32[(r22<<2>>2)+r8]+r24|0];HEAP8[r16+19|0]=HEAP8[r23+r24+r21|0];HEAP8[r16+20|0]=HEAP8[r13+r24|0];r24=HEAPU8[r18+7|0];r13=HEAPU8[r19+7|0];r21=HEAP32[(r13<<2>>2)+r5];r23=HEAP32[(r24<<2>>2)+r6];r22=HEAP32[(r13<<2>>2)+r7];r13=HEAPU8[r17+7|0];HEAP8[r16+21|0]=HEAP8[HEAP32[(r24<<2>>2)+r8]+r13|0];HEAP8[r16+22|0]=HEAP8[r23+r13+r22|0];HEAP8[r16+23|0]=HEAP8[r21+r13|0];r13=r20-1|0;if((r13|0)==0){break}else{r16=r16+24|0;r17=r17+8|0;r18=r18+8|0;r19=r19+8|0;r20=r13}}r20=HEAP32[r9>>2];r19=r2-1|0;if((r19|0)==0){break}else{r11=r11+r14+HEAP32[r10>>2]|0;r3=r3+r15+r20|0;r1=r1+r15+r20|0;r12=r12+r15+r20|0;r2=r19}}return}function _rgb_c_8_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40;r4=HEAP32[r1+36>>2];r5=r1+4|0;r6=(r1+60|0)>>2;r7=(r1+1084|0)>>2;r8=(r1+2108|0)>>2;r9=(r1+3132|0)>>2;r10=r1+16|0;r11=r1+24|0;r12=r1+40|0;r13=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r14=HEAP32[r2+8>>2];r2=16;r15=r4;while(1){r4=r15&255;r16=r4<<1;r17=HEAP32[r5>>2];r18=HEAPU8[r16+5251516|0];r19=HEAPU8[(r16|1)+5251516|0];r20=HEAPU8[r16+5251518|0];r21=HEAPU8[r16+5251519|0];r22=HEAPU8[r16+5251520|0];r23=HEAPU8[r16+5251521|0];r24=HEAPU8[r16+5251522|0];r25=HEAPU8[r16+5251523|0];r26=HEAPU8[r16+5251524|0];r27=HEAPU8[r16+5251525|0];r28=HEAPU8[r16+5251526|0];r29=HEAPU8[r16+5251527|0];r30=HEAPU8[r16+5251528|0];r31=HEAPU8[r16+5251529|0];r32=HEAPU8[r16+5251530|0];r33=HEAPU8[r16+5251531|0];r16=r17<<3;r34=r13;r35=r3;r36=r1;r37=r14;r38=r17;while(1){r17=HEAPU8[r36];r39=HEAPU8[r37];r40=HEAPU8[r35];HEAP8[r34]=(HEAP8[HEAP32[(r17<<2>>2)+r7]+(r40+HEAP32[(r39<<2>>2)+r8]-r18)|0]+HEAP8[HEAP32[(r39<<2>>2)+r6]+r18+r40|0]&255)+HEAP8[HEAP32[(r17<<2>>2)+r9]+r19+r40|0]&255;r40=HEAPU8[r36+1|0];r17=HEAPU8[r37+1|0];r39=HEAPU8[r35+1|0];HEAP8[r34+1|0]=(HEAP8[HEAP32[(r40<<2>>2)+r7]+(r39+HEAP32[(r17<<2>>2)+r8]-r20)|0]+HEAP8[HEAP32[(r17<<2>>2)+r6]+r20+r39|0]&255)+HEAP8[HEAP32[(r40<<2>>2)+r9]+r21+r39|0]&255;r39=HEAPU8[r36+2|0];r40=HEAPU8[r37+2|0];r17=HEAPU8[r35+2|0];HEAP8[r34+2|0]=(HEAP8[HEAP32[(r39<<2>>2)+r7]+(r17+HEAP32[(r40<<2>>2)+r8]-r22)|0]+HEAP8[HEAP32[(r40<<2>>2)+r6]+r22+r17|0]&255)+HEAP8[HEAP32[(r39<<2>>2)+r9]+r23+r17|0]&255;r17=HEAPU8[r36+3|0];r39=HEAPU8[r37+3|0];r40=HEAPU8[r35+3|0];HEAP8[r34+3|0]=(HEAP8[HEAP32[(r17<<2>>2)+r7]+(r40+HEAP32[(r39<<2>>2)+r8]-r24)|0]+HEAP8[HEAP32[(r39<<2>>2)+r6]+r24+r40|0]&255)+HEAP8[HEAP32[(r17<<2>>2)+r9]+r25+r40|0]&255;r40=HEAPU8[r36+4|0];r17=HEAPU8[r37+4|0];r39=HEAPU8[r35+4|0];HEAP8[r34+4|0]=(HEAP8[HEAP32[(r40<<2>>2)+r7]+(r39+HEAP32[(r17<<2>>2)+r8]-r26)|0]+HEAP8[HEAP32[(r17<<2>>2)+r6]+r26+r39|0]&255)+HEAP8[HEAP32[(r40<<2>>2)+r9]+r27+r39|0]&255;r39=HEAPU8[r36+5|0];r40=HEAPU8[r37+5|0];r17=HEAPU8[r35+5|0];HEAP8[r34+5|0]=(HEAP8[HEAP32[(r39<<2>>2)+r7]+(r17+HEAP32[(r40<<2>>2)+r8]-r28)|0]+HEAP8[HEAP32[(r40<<2>>2)+r6]+r28+r17|0]&255)+HEAP8[HEAP32[(r39<<2>>2)+r9]+r29+r17|0]&255;r17=HEAPU8[r36+6|0];r39=HEAPU8[r37+6|0];r40=HEAPU8[r35+6|0];HEAP8[r34+6|0]=(HEAP8[HEAP32[(r17<<2>>2)+r7]+(r40+HEAP32[(r39<<2>>2)+r8]-r30)|0]+HEAP8[HEAP32[(r39<<2>>2)+r6]+r30+r40|0]&255)+HEAP8[HEAP32[(r17<<2>>2)+r9]+r31+r40|0]&255;r40=HEAPU8[r36+7|0];r17=HEAPU8[r37+7|0];r39=HEAPU8[r35+7|0];HEAP8[r34+7|0]=(HEAP8[HEAP32[(r40<<2>>2)+r7]+(r39+HEAP32[(r17<<2>>2)+r8]-r32)|0]+HEAP8[HEAP32[(r17<<2>>2)+r6]+r32+r39|0]&255)+HEAP8[HEAP32[(r40<<2>>2)+r9]+r33+r39|0]&255;r39=r38-1|0;if((r39|0)==0){break}else{r34=r34+8|0;r35=r35+8|0;r36=r36+8|0;r37=r37+8|0;r38=r39}}r38=HEAP32[r10>>2];r37=r2-1|0;if((r37|0)==0){break}else{r13=r13+r16+HEAP32[r11>>2]|0;r3=r3+r16+r38|0;r1=r1+r16+r38|0;r14=r14+r16+r38|0;r2=r37;r15=HEAP32[r12>>2]+r4|0}}return}function _rgb_c_16_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r4=r1+4|0;r5=(r1+60|0)>>2;r6=(r1+1084|0)>>2;r7=(r1+2108|0)>>2;r8=(r1+3132|0)>>2;r9=r1+16|0;r10=r1+24|0;r11=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r12=HEAP32[r2+8>>2];r2=16;while(1){r13=HEAP32[r4>>2];r14=r13<<4;r15=r13<<3;r16=r11,r17=r16>>1;r18=r3;r19=r1;r20=r12;r21=r13;while(1){r13=HEAPU8[r19];r22=HEAPU8[r20];r23=HEAPU8[r18];HEAP16[r17]=(HEAP16[HEAP32[(r13<<2>>2)+r6]+HEAP32[(r22<<2>>2)+r7]+(r23<<1)>>1]+HEAP16[HEAP32[(r22<<2>>2)+r5]+(r23<<1)>>1]&65535)+HEAP16[HEAP32[(r13<<2>>2)+r8]+(r23<<1)>>1]&65535;r23=HEAPU8[r19+1|0];r13=HEAPU8[r20+1|0];r22=HEAPU8[r18+1|0];HEAP16[r17+1]=(HEAP16[HEAP32[(r23<<2>>2)+r6]+HEAP32[(r13<<2>>2)+r7]+(r22<<1)>>1]+HEAP16[HEAP32[(r13<<2>>2)+r5]+(r22<<1)>>1]&65535)+HEAP16[HEAP32[(r23<<2>>2)+r8]+(r22<<1)>>1]&65535;r22=HEAPU8[r19+2|0];r23=HEAPU8[r20+2|0];r13=HEAPU8[r18+2|0];HEAP16[r17+2]=(HEAP16[HEAP32[(r22<<2>>2)+r6]+HEAP32[(r23<<2>>2)+r7]+(r13<<1)>>1]+HEAP16[HEAP32[(r23<<2>>2)+r5]+(r13<<1)>>1]&65535)+HEAP16[HEAP32[(r22<<2>>2)+r8]+(r13<<1)>>1]&65535;r13=HEAPU8[r19+3|0];r22=HEAPU8[r20+3|0];r23=HEAPU8[r18+3|0];HEAP16[r17+3]=(HEAP16[HEAP32[(r13<<2>>2)+r6]+HEAP32[(r22<<2>>2)+r7]+(r23<<1)>>1]+HEAP16[HEAP32[(r22<<2>>2)+r5]+(r23<<1)>>1]&65535)+HEAP16[HEAP32[(r13<<2>>2)+r8]+(r23<<1)>>1]&65535;r23=HEAPU8[r19+4|0];r13=HEAPU8[r20+4|0];r22=HEAPU8[r18+4|0];HEAP16[r17+4]=(HEAP16[HEAP32[(r23<<2>>2)+r6]+HEAP32[(r13<<2>>2)+r7]+(r22<<1)>>1]+HEAP16[HEAP32[(r13<<2>>2)+r5]+(r22<<1)>>1]&65535)+HEAP16[HEAP32[(r23<<2>>2)+r8]+(r22<<1)>>1]&65535;r22=HEAPU8[r19+5|0];r23=HEAPU8[r20+5|0];r13=HEAPU8[r18+5|0];HEAP16[r17+5]=(HEAP16[HEAP32[(r22<<2>>2)+r6]+HEAP32[(r23<<2>>2)+r7]+(r13<<1)>>1]+HEAP16[HEAP32[(r23<<2>>2)+r5]+(r13<<1)>>1]&65535)+HEAP16[HEAP32[(r22<<2>>2)+r8]+(r13<<1)>>1]&65535;r13=HEAPU8[r19+6|0];r22=HEAPU8[r20+6|0];r23=HEAPU8[r18+6|0];HEAP16[r17+6]=(HEAP16[HEAP32[(r13<<2>>2)+r6]+HEAP32[(r22<<2>>2)+r7]+(r23<<1)>>1]+HEAP16[HEAP32[(r22<<2>>2)+r5]+(r23<<1)>>1]&65535)+HEAP16[HEAP32[(r13<<2>>2)+r8]+(r23<<1)>>1]&65535;r23=HEAPU8[r19+7|0];r13=HEAPU8[r20+7|0];r22=HEAPU8[r18+7|0];HEAP16[r17+7]=(HEAP16[HEAP32[(r23<<2>>2)+r6]+HEAP32[(r13<<2>>2)+r7]+(r22<<1)>>1]+HEAP16[HEAP32[(r13<<2>>2)+r5]+(r22<<1)>>1]&65535)+HEAP16[HEAP32[(r23<<2>>2)+r8]+(r22<<1)>>1]&65535;r22=r21-1|0;if((r22|0)==0){break}else{r16=r16+16|0,r17=r16>>1;r18=r18+8|0;r19=r19+8|0;r20=r20+8|0;r21=r22}}r21=HEAP32[r9>>2];r20=r2-1|0;if((r20|0)==0){break}else{r11=r11+r14+HEAP32[r10>>2]|0;r3=r3+r15+r21|0;r1=r1+r15+r21|0;r12=r12+r15+r21|0;r2=r20}}return}function _rgb_c_24_rgb_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r4=r1+4|0;r5=(r1+60|0)>>2;r6=(r1+1084|0)>>2;r7=(r1+2108|0)>>2;r8=(r1+3132|0)>>2;r9=r1+16|0;r10=r1+24|0;r11=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r12=HEAP32[r2+8>>2];r2=16;while(1){r13=HEAP32[r4>>2];r14=r13*24&-1;r15=r13<<3;r16=r11;r17=r3;r18=r1;r19=r12;r20=r13;while(1){r13=HEAPU8[r18];r21=HEAPU8[r19];r22=HEAP32[(r13<<2>>2)+r6];r23=HEAP32[(r21<<2>>2)+r7];r24=HEAP32[(r13<<2>>2)+r8];r13=HEAPU8[r17];HEAP8[r16]=HEAP8[HEAP32[(r21<<2>>2)+r5]+r13|0];HEAP8[r16+1|0]=HEAP8[r22+r13+r23|0];HEAP8[r16+2|0]=HEAP8[r24+r13|0];r13=HEAPU8[r18+1|0];r24=HEAPU8[r19+1|0];r23=HEAP32[(r13<<2>>2)+r6];r22=HEAP32[(r24<<2>>2)+r7];r21=HEAP32[(r13<<2>>2)+r8];r13=HEAPU8[r17+1|0];HEAP8[r16+3|0]=HEAP8[HEAP32[(r24<<2>>2)+r5]+r13|0];HEAP8[r16+4|0]=HEAP8[r23+r13+r22|0];HEAP8[r16+5|0]=HEAP8[r21+r13|0];r13=HEAPU8[r18+2|0];r21=HEAPU8[r19+2|0];r22=HEAP32[(r13<<2>>2)+r6];r23=HEAP32[(r21<<2>>2)+r7];r24=HEAP32[(r13<<2>>2)+r8];r13=HEAPU8[r17+2|0];HEAP8[r16+6|0]=HEAP8[HEAP32[(r21<<2>>2)+r5]+r13|0];HEAP8[r16+7|0]=HEAP8[r22+r13+r23|0];HEAP8[r16+8|0]=HEAP8[r24+r13|0];r13=HEAPU8[r18+3|0];r24=HEAPU8[r19+3|0];r23=HEAP32[(r13<<2>>2)+r6];r22=HEAP32[(r24<<2>>2)+r7];r21=HEAP32[(r13<<2>>2)+r8];r13=HEAPU8[r17+3|0];HEAP8[r16+9|0]=HEAP8[HEAP32[(r24<<2>>2)+r5]+r13|0];HEAP8[r16+10|0]=HEAP8[r23+r13+r22|0];HEAP8[r16+11|0]=HEAP8[r21+r13|0];r13=HEAPU8[r18+4|0];r21=HEAPU8[r19+4|0];r22=HEAP32[(r13<<2>>2)+r6];r23=HEAP32[(r21<<2>>2)+r7];r24=HEAP32[(r13<<2>>2)+r8];r13=HEAPU8[r17+4|0];HEAP8[r16+12|0]=HEAP8[HEAP32[(r21<<2>>2)+r5]+r13|0];HEAP8[r16+13|0]=HEAP8[r22+r13+r23|0];HEAP8[r16+14|0]=HEAP8[r24+r13|0];r13=HEAPU8[r18+5|0];r24=HEAPU8[r19+5|0];r23=HEAP32[(r13<<2>>2)+r6];r22=HEAP32[(r24<<2>>2)+r7];r21=HEAP32[(r13<<2>>2)+r8];r13=HEAPU8[r17+5|0];HEAP8[r16+15|0]=HEAP8[HEAP32[(r24<<2>>2)+r5]+r13|0];HEAP8[r16+16|0]=HEAP8[r23+r13+r22|0];HEAP8[r16+17|0]=HEAP8[r21+r13|0];r13=HEAPU8[r18+6|0];r21=HEAPU8[r19+6|0];r22=HEAP32[(r13<<2>>2)+r6];r23=HEAP32[(r21<<2>>2)+r7];r24=HEAP32[(r13<<2>>2)+r8];r13=HEAPU8[r17+6|0];HEAP8[r16+18|0]=HEAP8[HEAP32[(r21<<2>>2)+r5]+r13|0];HEAP8[r16+19|0]=HEAP8[r22+r13+r23|0];HEAP8[r16+20|0]=HEAP8[r24+r13|0];r13=HEAPU8[r18+7|0];r24=HEAPU8[r19+7|0];r23=HEAP32[(r13<<2>>2)+r6];r22=HEAP32[(r24<<2>>2)+r7];r21=HEAP32[(r13<<2>>2)+r8];r13=HEAPU8[r17+7|0];HEAP8[r16+21|0]=HEAP8[HEAP32[(r24<<2>>2)+r5]+r13|0];HEAP8[r16+22|0]=HEAP8[r23+r13+r22|0];HEAP8[r16+23|0]=HEAP8[r21+r13|0];r13=r20-1|0;if((r13|0)==0){break}else{r16=r16+24|0;r17=r17+8|0;r18=r18+8|0;r19=r19+8|0;r20=r13}}r20=HEAP32[r9>>2];r19=r2-1|0;if((r19|0)==0){break}else{r11=r11+r14+HEAP32[r10>>2]|0;r3=r3+r15+r20|0;r1=r1+r15+r20|0;r12=r12+r15+r20|0;r2=r19}}return}function _rgb_c_32_444(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r4=r1+4|0;r5=(r1+60|0)>>2;r6=(r1+1084|0)>>2;r7=(r1+2108|0)>>2;r8=(r1+3132|0)>>2;r9=r1+16|0;r10=r1+24|0;r11=HEAP32[r1>>2]+Math.imul(HEAP32[r1+12>>2],r3)|0;r3=HEAP32[r2>>2];r1=HEAP32[r2+4>>2];r12=HEAP32[r2+8>>2];r2=16;while(1){r13=HEAP32[r4>>2];r14=r13<<5;r15=r13<<3;r16=r11,r17=r16>>2;r18=r3;r19=r1;r20=r12;r21=r13;while(1){r13=HEAPU8[r19];r22=HEAPU8[r20];r23=HEAPU8[r18];HEAP32[r17]=HEAP32[HEAP32[(r13<<2>>2)+r6]+HEAP32[(r22<<2>>2)+r7]+(r23<<2)>>2]+HEAP32[HEAP32[(r22<<2>>2)+r5]+(r23<<2)>>2]+HEAP32[HEAP32[(r13<<2>>2)+r8]+(r23<<2)>>2]|0;r23=HEAPU8[r19+1|0];r13=HEAPU8[r20+1|0];r22=HEAPU8[r18+1|0];HEAP32[r17+1]=HEAP32[HEAP32[(r23<<2>>2)+r6]+HEAP32[(r13<<2>>2)+r7]+(r22<<2)>>2]+HEAP32[HEAP32[(r13<<2>>2)+r5]+(r22<<2)>>2]+HEAP32[HEAP32[(r23<<2>>2)+r8]+(r22<<2)>>2]|0;r22=HEAPU8[r19+2|0];r23=HEAPU8[r20+2|0];r13=HEAPU8[r18+2|0];HEAP32[r17+2]=HEAP32[HEAP32[(r22<<2>>2)+r6]+HEAP32[(r23<<2>>2)+r7]+(r13<<2)>>2]+HEAP32[HEAP32[(r23<<2>>2)+r5]+(r13<<2)>>2]+HEAP32[HEAP32[(r22<<2>>2)+r8]+(r13<<2)>>2]|0;r13=HEAPU8[r19+3|0];r22=HEAPU8[r20+3|0];r23=HEAPU8[r18+3|0];HEAP32[r17+3]=HEAP32[HEAP32[(r13<<2>>2)+r6]+HEAP32[(r22<<2>>2)+r7]+(r23<<2)>>2]+HEAP32[HEAP32[(r22<<2>>2)+r5]+(r23<<2)>>2]+HEAP32[HEAP32[(r13<<2>>2)+r8]+(r23<<2)>>2]|0;r23=HEAPU8[r19+4|0];r13=HEAPU8[r20+4|0];r22=HEAPU8[r18+4|0];HEAP32[r17+4]=HEAP32[HEAP32[(r23<<2>>2)+r6]+HEAP32[(r13<<2>>2)+r7]+(r22<<2)>>2]+HEAP32[HEAP32[(r13<<2>>2)+r5]+(r22<<2)>>2]+HEAP32[HEAP32[(r23<<2>>2)+r8]+(r22<<2)>>2]|0;r22=HEAPU8[r19+5|0];r23=HEAPU8[r20+5|0];r13=HEAPU8[r18+5|0];HEAP32[r17+5]=HEAP32[HEAP32[(r22<<2>>2)+r6]+HEAP32[(r23<<2>>2)+r7]+(r13<<2)>>2]+HEAP32[HEAP32[(r23<<2>>2)+r5]+(r13<<2)>>2]+HEAP32[HEAP32[(r22<<2>>2)+r8]+(r13<<2)>>2]|0;r13=HEAPU8[r19+6|0];r22=HEAPU8[r20+6|0];r23=HEAPU8[r18+6|0];HEAP32[r17+6]=HEAP32[HEAP32[(r13<<2>>2)+r6]+HEAP32[(r22<<2>>2)+r7]+(r23<<2)>>2]+HEAP32[HEAP32[(r22<<2>>2)+r5]+(r23<<2)>>2]+HEAP32[HEAP32[(r13<<2>>2)+r8]+(r23<<2)>>2]|0;r23=HEAPU8[r19+7|0];r13=HEAPU8[r20+7|0];r22=HEAPU8[r18+7|0];HEAP32[r17+7]=HEAP32[HEAP32[(r23<<2>>2)+r6]+HEAP32[(r13<<2>>2)+r7]+(r22<<2)>>2]+HEAP32[HEAP32[(r13<<2>>2)+r5]+(r22<<2)>>2]+HEAP32[HEAP32[(r23<<2>>2)+r8]+(r22<<2)>>2]|0;r22=r21-1|0;if((r22|0)==0){break}else{r16=r16+32|0,r17=r16>>2;r18=r18+8|0;r19=r19+8|0;r20=r20+8|0;r21=r22}}r21=HEAP32[r9>>2];r20=r2-1|0;if((r20|0)==0){break}else{r11=r11+r14+HEAP32[r10>>2]|0;r3=r3+r15+r21|0;r1=r1+r15+r21|0;r12=r12+r15+r21|0;r2=r20}}return}function _rgb_start(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=r1>>2;r5=HEAP32[r4+12];r6=HEAP32[r4+11];r7=r1+8|0;HEAP32[r7>>2]=r6;r8=HEAP32[r2>>2];r2=r1;HEAP32[r2>>2]=r8;r9=HEAP32[r4+13];r10=r1+12|0;HEAP32[r10>>2]=r9;r11=(r1+40|0)>>2;HEAP32[r11]=32;r12=HEAPU8[(HEAP32[r3>>2]&63)+5251452|0];r13=(r1+36|0)>>2;HEAP32[r13]=r12;do{if((HEAP32[r3+4>>2]|0)==1){r1=r5<<1;r14=r6<<1;HEAP32[r7>>2]=r14;r15=r9<<1;HEAP32[r10>>2]=r15;HEAP32[r11]=64;HEAP32[r13]=r12+16|0;if((HEAP32[r3+16>>2]&8|0)!=0){r16=r1;r17=r14;r18=r15;r19=64;break}HEAP32[r2>>2]=r8+r9|0;HEAP32[r13]=r12+48|0;r16=r1;r17=r14;r18=r15;r19=64}else{r16=r5;r17=r6;r18=r9;r19=32}}while(0);r9=HEAP32[r4+8];HEAP32[r4+4]=(r17<<r9)-r6|0;HEAP32[r4+5]=r16-r5|0;HEAP32[r4+6]=(r18<<r9)-HEAP32[r4+14]|0;HEAP32[r11]=r19<<r9;return}
function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[1313049];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=(r8<<2)+5252236|0;r10=(r8+2<<2)+5252236|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)==(r12|0)){HEAP32[1313049]=r5&(1<<r7^-1)}else{if(r12>>>0<HEAP32[1313053]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0<=HEAP32[1313051]>>>0){r15=r3,r16=r15>>2;break}if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r17=r13>>>(r9>>>0);r13=r17>>>1&2;r18=r17>>>(r13>>>0);r17=r18>>>1&1;r19=(r10|r12|r9|r13|r17)+(r18>>>(r17>>>0))|0;r17=r19<<1;r18=(r17<<2)+5252236|0;r13=(r17+2<<2)+5252236|0;r17=HEAP32[r13>>2];r9=r17+8|0;r12=HEAP32[r9>>2];do{if((r18|0)==(r12|0)){HEAP32[1313049]=r5&(1<<r19^-1)}else{if(r12>>>0<HEAP32[1313053]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r17|0)){HEAP32[r10>>2]=r18;HEAP32[r13>>2]=r12;break}else{_abort()}}}while(0);r12=r19<<3;r13=r12-r3|0;HEAP32[r17+4>>2]=r3|3;r18=r17;r5=r18+r3|0;HEAP32[r18+(r3|4)>>2]=r13|1;HEAP32[r18+r12>>2]=r13;r12=HEAP32[1313051];if((r12|0)!=0){r18=HEAP32[1313054];r4=r12>>>3;r12=r4<<1;r6=(r12<<2)+5252236|0;r11=HEAP32[1313049];r8=1<<r4;do{if((r11&r8|0)==0){HEAP32[1313049]=r11|r8;r20=r6;r21=(r12+2<<2)+5252236|0}else{r4=(r12+2<<2)+5252236|0;r7=HEAP32[r4>>2];if(r7>>>0>=HEAP32[1313053]>>>0){r20=r7;r21=r4;break}_abort()}}while(0);HEAP32[r21>>2]=r18;HEAP32[r20+12>>2]=r18;HEAP32[r18+8>>2]=r20;HEAP32[r18+12>>2]=r6}HEAP32[1313051]=r13;HEAP32[1313054]=r5;r14=r9;return r14}r12=HEAP32[1313050];if((r12|0)==0){r15=r3,r16=r15>>2;break}r8=(r12&-r12)-1|0;r12=r8>>>12&16;r11=r8>>>(r12>>>0);r8=r11>>>5&8;r17=r11>>>(r8>>>0);r11=r17>>>2&4;r19=r17>>>(r11>>>0);r17=r19>>>1&2;r4=r19>>>(r17>>>0);r19=r4>>>1&1;r7=HEAP32[((r8|r12|r11|r17|r19)+(r4>>>(r19>>>0))<<2)+5252500>>2];r19=r7;r4=r7,r17=r4>>2;r11=(HEAP32[r7+4>>2]&-8)-r3|0;while(1){r7=HEAP32[r19+16>>2];if((r7|0)==0){r12=HEAP32[r19+20>>2];if((r12|0)==0){break}else{r22=r12}}else{r22=r7}r7=(HEAP32[r22+4>>2]&-8)-r3|0;r12=r7>>>0<r11>>>0;r19=r22;r4=r12?r22:r4,r17=r4>>2;r11=r12?r7:r11}r19=r4;r9=HEAP32[1313053];if(r19>>>0<r9>>>0){_abort()}r5=r19+r3|0;r13=r5;if(r19>>>0>=r5>>>0){_abort()}r5=HEAP32[r17+6];r6=HEAP32[r17+3];L163:do{if((r6|0)==(r4|0)){r18=r4+20|0;r7=HEAP32[r18>>2];do{if((r7|0)==0){r12=r4+16|0;r8=HEAP32[r12>>2];if((r8|0)==0){r23=0,r24=r23>>2;break L163}else{r25=r8;r26=r12;break}}else{r25=r7;r26=r18}}while(0);while(1){r18=r25+20|0;r7=HEAP32[r18>>2];if((r7|0)!=0){r25=r7;r26=r18;continue}r18=r25+16|0;r7=HEAP32[r18>>2];if((r7|0)==0){break}else{r25=r7;r26=r18}}if(r26>>>0<r9>>>0){_abort()}else{HEAP32[r26>>2]=0;r23=r25,r24=r23>>2;break}}else{r18=HEAP32[r17+2];if(r18>>>0<r9>>>0){_abort()}r7=r18+12|0;if((HEAP32[r7>>2]|0)!=(r4|0)){_abort()}r12=r6+8|0;if((HEAP32[r12>>2]|0)==(r4|0)){HEAP32[r7>>2]=r6;HEAP32[r12>>2]=r18;r23=r6,r24=r23>>2;break}else{_abort()}}}while(0);L185:do{if((r5|0)!=0){r6=r4+28|0;r9=(HEAP32[r6>>2]<<2)+5252500|0;do{if((r4|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r23;if((r23|0)!=0){break}HEAP32[1313050]=HEAP32[1313050]&(1<<HEAP32[r6>>2]^-1);break L185}else{if(r5>>>0<HEAP32[1313053]>>>0){_abort()}r18=r5+16|0;if((HEAP32[r18>>2]|0)==(r4|0)){HEAP32[r18>>2]=r23}else{HEAP32[r5+20>>2]=r23}if((r23|0)==0){break L185}}}while(0);if(r23>>>0<HEAP32[1313053]>>>0){_abort()}HEAP32[r24+6]=r5;r6=HEAP32[r17+4];do{if((r6|0)!=0){if(r6>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r24+4]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);r6=HEAP32[r17+5];if((r6|0)==0){break}if(r6>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r24+5]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);if(r11>>>0<16){r5=r11+r3|0;HEAP32[r17+1]=r5|3;r6=r5+(r19+4)|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}else{HEAP32[r17+1]=r3|3;HEAP32[r19+(r3|4)>>2]=r11|1;HEAP32[r19+r11+r3>>2]=r11;r6=HEAP32[1313051];if((r6|0)!=0){r5=HEAP32[1313054];r9=r6>>>3;r6=r9<<1;r18=(r6<<2)+5252236|0;r12=HEAP32[1313049];r7=1<<r9;do{if((r12&r7|0)==0){HEAP32[1313049]=r12|r7;r27=r18;r28=(r6+2<<2)+5252236|0}else{r9=(r6+2<<2)+5252236|0;r8=HEAP32[r9>>2];if(r8>>>0>=HEAP32[1313053]>>>0){r27=r8;r28=r9;break}_abort()}}while(0);HEAP32[r28>>2]=r5;HEAP32[r27+12>>2]=r5;HEAP32[r5+8>>2]=r27;HEAP32[r5+12>>2]=r18}HEAP32[1313051]=r11;HEAP32[1313054]=r13}r6=r4+8|0;if((r6|0)==0){r15=r3,r16=r15>>2;break}else{r14=r6}return r14}else{if(r1>>>0>4294967231){r15=-1,r16=r15>>2;break}r6=r1+11|0;r7=r6&-8,r12=r7>>2;r19=HEAP32[1313050];if((r19|0)==0){r15=r7,r16=r15>>2;break}r17=-r7|0;r9=r6>>>8;do{if((r9|0)==0){r29=0}else{if(r7>>>0>16777215){r29=31;break}r6=(r9+1048320|0)>>>16&8;r8=r9<<r6;r10=(r8+520192|0)>>>16&4;r30=r8<<r10;r8=(r30+245760|0)>>>16&2;r31=14-(r10|r6|r8)+(r30<<r8>>>15)|0;r29=r7>>>((r31+7|0)>>>0)&1|r31<<1}}while(0);r9=HEAP32[(r29<<2)+5252500>>2];L233:do{if((r9|0)==0){r32=0;r33=r17;r34=0}else{if((r29|0)==31){r35=0}else{r35=25-(r29>>>1)|0}r4=0;r13=r17;r11=r9,r18=r11>>2;r5=r7<<r35;r31=0;while(1){r8=HEAP32[r18+1]&-8;r30=r8-r7|0;if(r30>>>0<r13>>>0){if((r8|0)==(r7|0)){r32=r11;r33=r30;r34=r11;break L233}else{r36=r11;r37=r30}}else{r36=r4;r37=r13}r30=HEAP32[r18+5];r8=HEAP32[((r5>>>31<<2)+16>>2)+r18];r6=(r30|0)==0|(r30|0)==(r8|0)?r31:r30;if((r8|0)==0){r32=r36;r33=r37;r34=r6;break L233}else{r4=r36;r13=r37;r11=r8,r18=r11>>2;r5=r5<<1;r31=r6}}}}while(0);if((r34|0)==0&(r32|0)==0){r9=2<<r29;r17=r19&(r9|-r9);if((r17|0)==0){r15=r7,r16=r15>>2;break}r9=(r17&-r17)-1|0;r17=r9>>>12&16;r31=r9>>>(r17>>>0);r9=r31>>>5&8;r5=r31>>>(r9>>>0);r31=r5>>>2&4;r11=r5>>>(r31>>>0);r5=r11>>>1&2;r18=r11>>>(r5>>>0);r11=r18>>>1&1;r38=HEAP32[((r9|r17|r31|r5|r11)+(r18>>>(r11>>>0))<<2)+5252500>>2]}else{r38=r34}L248:do{if((r38|0)==0){r39=r33;r40=r32,r41=r40>>2}else{r11=r38,r18=r11>>2;r5=r33;r31=r32;while(1){r17=(HEAP32[r18+1]&-8)-r7|0;r9=r17>>>0<r5>>>0;r13=r9?r17:r5;r17=r9?r11:r31;r9=HEAP32[r18+4];if((r9|0)!=0){r11=r9,r18=r11>>2;r5=r13;r31=r17;continue}r9=HEAP32[r18+5];if((r9|0)==0){r39=r13;r40=r17,r41=r40>>2;break L248}else{r11=r9,r18=r11>>2;r5=r13;r31=r17}}}}while(0);if((r40|0)==0){r15=r7,r16=r15>>2;break}if(r39>>>0>=(HEAP32[1313051]-r7|0)>>>0){r15=r7,r16=r15>>2;break}r19=r40,r31=r19>>2;r5=HEAP32[1313053];if(r19>>>0<r5>>>0){_abort()}r11=r19+r7|0;r18=r11;if(r19>>>0>=r11>>>0){_abort()}r17=HEAP32[r41+6];r13=HEAP32[r41+3];L261:do{if((r13|0)==(r40|0)){r9=r40+20|0;r4=HEAP32[r9>>2];do{if((r4|0)==0){r6=r40+16|0;r8=HEAP32[r6>>2];if((r8|0)==0){r42=0,r43=r42>>2;break L261}else{r44=r8;r45=r6;break}}else{r44=r4;r45=r9}}while(0);while(1){r9=r44+20|0;r4=HEAP32[r9>>2];if((r4|0)!=0){r44=r4;r45=r9;continue}r9=r44+16|0;r4=HEAP32[r9>>2];if((r4|0)==0){break}else{r44=r4;r45=r9}}if(r45>>>0<r5>>>0){_abort()}else{HEAP32[r45>>2]=0;r42=r44,r43=r42>>2;break}}else{r9=HEAP32[r41+2];if(r9>>>0<r5>>>0){_abort()}r4=r9+12|0;if((HEAP32[r4>>2]|0)!=(r40|0)){_abort()}r6=r13+8|0;if((HEAP32[r6>>2]|0)==(r40|0)){HEAP32[r4>>2]=r13;HEAP32[r6>>2]=r9;r42=r13,r43=r42>>2;break}else{_abort()}}}while(0);L283:do{if((r17|0)!=0){r13=r40+28|0;r5=(HEAP32[r13>>2]<<2)+5252500|0;do{if((r40|0)==(HEAP32[r5>>2]|0)){HEAP32[r5>>2]=r42;if((r42|0)!=0){break}HEAP32[1313050]=HEAP32[1313050]&(1<<HEAP32[r13>>2]^-1);break L283}else{if(r17>>>0<HEAP32[1313053]>>>0){_abort()}r9=r17+16|0;if((HEAP32[r9>>2]|0)==(r40|0)){HEAP32[r9>>2]=r42}else{HEAP32[r17+20>>2]=r42}if((r42|0)==0){break L283}}}while(0);if(r42>>>0<HEAP32[1313053]>>>0){_abort()}HEAP32[r43+6]=r17;r13=HEAP32[r41+4];do{if((r13|0)!=0){if(r13>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r43+4]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);r13=HEAP32[r41+5];if((r13|0)==0){break}if(r13>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r43+5]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);do{if(r39>>>0<16){r17=r39+r7|0;HEAP32[r41+1]=r17|3;r13=r17+(r19+4)|0;HEAP32[r13>>2]=HEAP32[r13>>2]|1}else{HEAP32[r41+1]=r7|3;HEAP32[((r7|4)>>2)+r31]=r39|1;HEAP32[(r39>>2)+r31+r12]=r39;r13=r39>>>3;if(r39>>>0<256){r17=r13<<1;r5=(r17<<2)+5252236|0;r9=HEAP32[1313049];r6=1<<r13;do{if((r9&r6|0)==0){HEAP32[1313049]=r9|r6;r46=r5;r47=(r17+2<<2)+5252236|0}else{r13=(r17+2<<2)+5252236|0;r4=HEAP32[r13>>2];if(r4>>>0>=HEAP32[1313053]>>>0){r46=r4;r47=r13;break}_abort()}}while(0);HEAP32[r47>>2]=r18;HEAP32[r46+12>>2]=r18;HEAP32[r12+(r31+2)]=r46;HEAP32[r12+(r31+3)]=r5;break}r17=r11;r6=r39>>>8;do{if((r6|0)==0){r48=0}else{if(r39>>>0>16777215){r48=31;break}r9=(r6+1048320|0)>>>16&8;r13=r6<<r9;r4=(r13+520192|0)>>>16&4;r8=r13<<r4;r13=(r8+245760|0)>>>16&2;r30=14-(r4|r9|r13)+(r8<<r13>>>15)|0;r48=r39>>>((r30+7|0)>>>0)&1|r30<<1}}while(0);r6=(r48<<2)+5252500|0;HEAP32[r12+(r31+7)]=r48;HEAP32[r12+(r31+5)]=0;HEAP32[r12+(r31+4)]=0;r5=HEAP32[1313050];r30=1<<r48;if((r5&r30|0)==0){HEAP32[1313050]=r5|r30;HEAP32[r6>>2]=r17;HEAP32[r12+(r31+6)]=r6;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}if((r48|0)==31){r49=0}else{r49=25-(r48>>>1)|0}r30=r39<<r49;r5=HEAP32[r6>>2];while(1){if((HEAP32[r5+4>>2]&-8|0)==(r39|0)){break}r50=(r30>>>31<<2)+r5+16|0;r6=HEAP32[r50>>2];if((r6|0)==0){r2=229;break}else{r30=r30<<1;r5=r6}}if(r2==229){if(r50>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r50>>2]=r17;HEAP32[r12+(r31+6)]=r5;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}}r30=r5+8|0;r6=HEAP32[r30>>2];r13=HEAP32[1313053];if(r5>>>0<r13>>>0){_abort()}if(r6>>>0<r13>>>0){_abort()}else{HEAP32[r6+12>>2]=r17;HEAP32[r30>>2]=r17;HEAP32[r12+(r31+2)]=r6;HEAP32[r12+(r31+3)]=r5;HEAP32[r12+(r31+6)]=0;break}}}while(0);r31=r40+8|0;if((r31|0)==0){r15=r7,r16=r15>>2;break}else{r14=r31}return r14}}while(0);r40=HEAP32[1313051];if(r15>>>0<=r40>>>0){r50=r40-r15|0;r39=HEAP32[1313054];if(r50>>>0>15){r49=r39;HEAP32[1313054]=r49+r15|0;HEAP32[1313051]=r50;HEAP32[(r49+4>>2)+r16]=r50|1;HEAP32[r49+r40>>2]=r50;HEAP32[r39+4>>2]=r15|3}else{HEAP32[1313051]=0;HEAP32[1313054]=0;HEAP32[r39+4>>2]=r40|3;r50=r40+(r39+4)|0;HEAP32[r50>>2]=HEAP32[r50>>2]|1}r14=r39+8|0;return r14}r39=HEAP32[1313052];if(r15>>>0<r39>>>0){r50=r39-r15|0;HEAP32[1313052]=r50;r39=HEAP32[1313055];r40=r39;HEAP32[1313055]=r40+r15|0;HEAP32[(r40+4>>2)+r16]=r50|1;HEAP32[r39+4>>2]=r15|3;r14=r39+8|0;return r14}do{if((HEAP32[1312855]|0)==0){r39=_sysconf(8);if((r39-1&r39|0)==0){HEAP32[1312857]=r39;HEAP32[1312856]=r39;HEAP32[1312858]=-1;HEAP32[1312859]=2097152;HEAP32[1312860]=0;HEAP32[1313160]=0;HEAP32[1312855]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);r39=r15+48|0;r50=HEAP32[1312857];r40=r15+47|0;r49=r50+r40|0;r48=-r50|0;r50=r49&r48;if(r50>>>0<=r15>>>0){r14=0;return r14}r46=HEAP32[1313159];do{if((r46|0)!=0){r47=HEAP32[1313157];r41=r47+r50|0;if(r41>>>0<=r47>>>0|r41>>>0>r46>>>0){r14=0}else{break}return r14}}while(0);L375:do{if((HEAP32[1313160]&4|0)==0){r46=HEAP32[1313055];L377:do{if((r46|0)==0){r2=259}else{r41=r46;r47=5252644;while(1){r51=r47|0;r42=HEAP32[r51>>2];if(r42>>>0<=r41>>>0){r52=r47+4|0;if((r42+HEAP32[r52>>2]|0)>>>0>r41>>>0){break}}r42=HEAP32[r47+8>>2];if((r42|0)==0){r2=259;break L377}else{r47=r42}}if((r47|0)==0){r2=259;break}r41=r49-HEAP32[1313052]&r48;if(r41>>>0>=2147483647){r53=0;break}r5=_sbrk(r41);r17=(r5|0)==(HEAP32[r51>>2]+HEAP32[r52>>2]|0);r54=r17?r5:-1;r55=r17?r41:0;r56=r5;r57=r41;r2=268;break}}while(0);do{if(r2==259){r46=_sbrk(0);if((r46|0)==-1){r53=0;break}r7=r46;r41=HEAP32[1312856];r5=r41-1|0;if((r5&r7|0)==0){r58=r50}else{r58=r50-r7+(r5+r7&-r41)|0}r41=HEAP32[1313157];r7=r41+r58|0;if(!(r58>>>0>r15>>>0&r58>>>0<2147483647)){r53=0;break}r5=HEAP32[1313159];if((r5|0)!=0){if(r7>>>0<=r41>>>0|r7>>>0>r5>>>0){r53=0;break}}r5=_sbrk(r58);r7=(r5|0)==(r46|0);r54=r7?r46:-1;r55=r7?r58:0;r56=r5;r57=r58;r2=268;break}}while(0);L397:do{if(r2==268){r5=-r57|0;if((r54|0)!=-1){r59=r55,r60=r59>>2;r61=r54,r62=r61>>2;r2=279;break L375}do{if((r56|0)!=-1&r57>>>0<2147483647&r57>>>0<r39>>>0){r7=HEAP32[1312857];r46=r40-r57+r7&-r7;if(r46>>>0>=2147483647){r63=r57;break}if((_sbrk(r46)|0)==-1){_sbrk(r5);r53=r55;break L397}else{r63=r46+r57|0;break}}else{r63=r57}}while(0);if((r56|0)==-1){r53=r55}else{r59=r63,r60=r59>>2;r61=r56,r62=r61>>2;r2=279;break L375}}}while(0);HEAP32[1313160]=HEAP32[1313160]|4;r64=r53;r2=276;break}else{r64=0;r2=276}}while(0);do{if(r2==276){if(r50>>>0>=2147483647){break}r53=_sbrk(r50);r56=_sbrk(0);if(!((r56|0)!=-1&(r53|0)!=-1&r53>>>0<r56>>>0)){break}r63=r56-r53|0;r56=r63>>>0>(r15+40|0)>>>0;r55=r56?r53:-1;if((r55|0)==-1){break}else{r59=r56?r63:r64,r60=r59>>2;r61=r55,r62=r61>>2;r2=279;break}}}while(0);do{if(r2==279){r64=HEAP32[1313157]+r59|0;HEAP32[1313157]=r64;if(r64>>>0>HEAP32[1313158]>>>0){HEAP32[1313158]=r64}r64=HEAP32[1313055],r50=r64>>2;L417:do{if((r64|0)==0){r55=HEAP32[1313053];if((r55|0)==0|r61>>>0<r55>>>0){HEAP32[1313053]=r61}HEAP32[1313161]=r61;HEAP32[1313162]=r59;HEAP32[1313164]=0;HEAP32[1313058]=HEAP32[1312855];HEAP32[1313057]=-1;r55=0;while(1){r63=r55<<1;r56=(r63<<2)+5252236|0;HEAP32[(r63+3<<2)+5252236>>2]=r56;HEAP32[(r63+2<<2)+5252236>>2]=r56;r56=r55+1|0;if((r56|0)==32){break}else{r55=r56}}r55=r61+8|0;if((r55&7|0)==0){r65=0}else{r65=-r55&7}r55=r59-40-r65|0;HEAP32[1313055]=r61+r65|0;HEAP32[1313052]=r55;HEAP32[(r65+4>>2)+r62]=r55|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1313056]=HEAP32[1312859]}else{r55=5252644,r56=r55>>2;while(1){r66=HEAP32[r56];r67=r55+4|0;r68=HEAP32[r67>>2];if((r61|0)==(r66+r68|0)){r2=291;break}r63=HEAP32[r56+2];if((r63|0)==0){break}else{r55=r63,r56=r55>>2}}do{if(r2==291){if((HEAP32[r56+3]&8|0)!=0){break}r55=r64;if(!(r55>>>0>=r66>>>0&r55>>>0<r61>>>0)){break}HEAP32[r67>>2]=r68+r59|0;r55=HEAP32[1313055];r63=HEAP32[1313052]+r59|0;r53=r55;r57=r55+8|0;if((r57&7|0)==0){r69=0}else{r69=-r57&7}r57=r63-r69|0;HEAP32[1313055]=r53+r69|0;HEAP32[1313052]=r57;HEAP32[r69+(r53+4)>>2]=r57|1;HEAP32[r63+(r53+4)>>2]=40;HEAP32[1313056]=HEAP32[1312859];break L417}}while(0);if(r61>>>0<HEAP32[1313053]>>>0){HEAP32[1313053]=r61}r56=r61+r59|0;r53=5252644;while(1){r70=r53|0;if((HEAP32[r70>>2]|0)==(r56|0)){r2=301;break}r63=HEAP32[r53+8>>2];if((r63|0)==0){break}else{r53=r63}}do{if(r2==301){if((HEAP32[r53+12>>2]&8|0)!=0){break}HEAP32[r70>>2]=r61;r56=r53+4|0;HEAP32[r56>>2]=HEAP32[r56>>2]+r59|0;r56=r61+8|0;if((r56&7|0)==0){r71=0}else{r71=-r56&7}r56=r59+(r61+8)|0;if((r56&7|0)==0){r72=0,r73=r72>>2}else{r72=-r56&7,r73=r72>>2}r56=r61+r72+r59|0;r63=r56;r57=r71+r15|0,r55=r57>>2;r40=r61+r57|0;r57=r40;r39=r56-(r61+r71)-r15|0;HEAP32[(r71+4>>2)+r62]=r15|3;do{if((r63|0)==(HEAP32[1313055]|0)){r54=HEAP32[1313052]+r39|0;HEAP32[1313052]=r54;HEAP32[1313055]=r57;HEAP32[r55+(r62+1)]=r54|1}else{if((r63|0)==(HEAP32[1313054]|0)){r54=HEAP32[1313051]+r39|0;HEAP32[1313051]=r54;HEAP32[1313054]=r57;HEAP32[r55+(r62+1)]=r54|1;HEAP32[(r54>>2)+r62+r55]=r54;break}r54=r59+4|0;r58=HEAP32[(r54>>2)+r62+r73];if((r58&3|0)==1){r52=r58&-8;r51=r58>>>3;L462:do{if(r58>>>0<256){r48=HEAP32[((r72|8)>>2)+r62+r60];r49=HEAP32[r73+(r62+(r60+3))];r5=(r51<<3)+5252236|0;do{if((r48|0)!=(r5|0)){if(r48>>>0<HEAP32[1313053]>>>0){_abort()}if((HEAP32[r48+12>>2]|0)==(r63|0)){break}_abort()}}while(0);if((r49|0)==(r48|0)){HEAP32[1313049]=HEAP32[1313049]&(1<<r51^-1);break}do{if((r49|0)==(r5|0)){r74=r49+8|0}else{if(r49>>>0<HEAP32[1313053]>>>0){_abort()}r47=r49+8|0;if((HEAP32[r47>>2]|0)==(r63|0)){r74=r47;break}_abort()}}while(0);HEAP32[r48+12>>2]=r49;HEAP32[r74>>2]=r48}else{r5=r56;r47=HEAP32[((r72|24)>>2)+r62+r60];r46=HEAP32[r73+(r62+(r60+3))];L483:do{if((r46|0)==(r5|0)){r7=r72|16;r41=r61+r54+r7|0;r17=HEAP32[r41>>2];do{if((r17|0)==0){r42=r61+r7+r59|0;r43=HEAP32[r42>>2];if((r43|0)==0){r75=0,r76=r75>>2;break L483}else{r77=r43;r78=r42;break}}else{r77=r17;r78=r41}}while(0);while(1){r41=r77+20|0;r17=HEAP32[r41>>2];if((r17|0)!=0){r77=r17;r78=r41;continue}r41=r77+16|0;r17=HEAP32[r41>>2];if((r17|0)==0){break}else{r77=r17;r78=r41}}if(r78>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r78>>2]=0;r75=r77,r76=r75>>2;break}}else{r41=HEAP32[((r72|8)>>2)+r62+r60];if(r41>>>0<HEAP32[1313053]>>>0){_abort()}r17=r41+12|0;if((HEAP32[r17>>2]|0)!=(r5|0)){_abort()}r7=r46+8|0;if((HEAP32[r7>>2]|0)==(r5|0)){HEAP32[r17>>2]=r46;HEAP32[r7>>2]=r41;r75=r46,r76=r75>>2;break}else{_abort()}}}while(0);if((r47|0)==0){break}r46=r72+(r61+(r59+28))|0;r48=(HEAP32[r46>>2]<<2)+5252500|0;do{if((r5|0)==(HEAP32[r48>>2]|0)){HEAP32[r48>>2]=r75;if((r75|0)!=0){break}HEAP32[1313050]=HEAP32[1313050]&(1<<HEAP32[r46>>2]^-1);break L462}else{if(r47>>>0<HEAP32[1313053]>>>0){_abort()}r49=r47+16|0;if((HEAP32[r49>>2]|0)==(r5|0)){HEAP32[r49>>2]=r75}else{HEAP32[r47+20>>2]=r75}if((r75|0)==0){break L462}}}while(0);if(r75>>>0<HEAP32[1313053]>>>0){_abort()}HEAP32[r76+6]=r47;r5=r72|16;r46=HEAP32[(r5>>2)+r62+r60];do{if((r46|0)!=0){if(r46>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r76+4]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r46=HEAP32[(r54+r5>>2)+r62];if((r46|0)==0){break}if(r46>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r76+5]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r79=r61+(r52|r72)+r59|0;r80=r52+r39|0}else{r79=r63;r80=r39}r54=r79+4|0;HEAP32[r54>>2]=HEAP32[r54>>2]&-2;HEAP32[r55+(r62+1)]=r80|1;HEAP32[(r80>>2)+r62+r55]=r80;r54=r80>>>3;if(r80>>>0<256){r51=r54<<1;r58=(r51<<2)+5252236|0;r46=HEAP32[1313049];r47=1<<r54;do{if((r46&r47|0)==0){HEAP32[1313049]=r46|r47;r81=r58;r82=(r51+2<<2)+5252236|0}else{r54=(r51+2<<2)+5252236|0;r48=HEAP32[r54>>2];if(r48>>>0>=HEAP32[1313053]>>>0){r81=r48;r82=r54;break}_abort()}}while(0);HEAP32[r82>>2]=r57;HEAP32[r81+12>>2]=r57;HEAP32[r55+(r62+2)]=r81;HEAP32[r55+(r62+3)]=r58;break}r51=r40;r47=r80>>>8;do{if((r47|0)==0){r83=0}else{if(r80>>>0>16777215){r83=31;break}r46=(r47+1048320|0)>>>16&8;r52=r47<<r46;r54=(r52+520192|0)>>>16&4;r48=r52<<r54;r52=(r48+245760|0)>>>16&2;r49=14-(r54|r46|r52)+(r48<<r52>>>15)|0;r83=r80>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r83<<2)+5252500|0;HEAP32[r55+(r62+7)]=r83;HEAP32[r55+(r62+5)]=0;HEAP32[r55+(r62+4)]=0;r58=HEAP32[1313050];r49=1<<r83;if((r58&r49|0)==0){HEAP32[1313050]=r58|r49;HEAP32[r47>>2]=r51;HEAP32[r55+(r62+6)]=r47;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}if((r83|0)==31){r84=0}else{r84=25-(r83>>>1)|0}r49=r80<<r84;r58=HEAP32[r47>>2];while(1){if((HEAP32[r58+4>>2]&-8|0)==(r80|0)){break}r85=(r49>>>31<<2)+r58+16|0;r47=HEAP32[r85>>2];if((r47|0)==0){r2=374;break}else{r49=r49<<1;r58=r47}}if(r2==374){if(r85>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r85>>2]=r51;HEAP32[r55+(r62+6)]=r58;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}}r49=r58+8|0;r47=HEAP32[r49>>2];r52=HEAP32[1313053];if(r58>>>0<r52>>>0){_abort()}if(r47>>>0<r52>>>0){_abort()}else{HEAP32[r47+12>>2]=r51;HEAP32[r49>>2]=r51;HEAP32[r55+(r62+2)]=r47;HEAP32[r55+(r62+3)]=r58;HEAP32[r55+(r62+6)]=0;break}}}while(0);r14=r61+(r71|8)|0;return r14}}while(0);r53=r64;r55=5252644,r40=r55>>2;while(1){r86=HEAP32[r40];if(r86>>>0<=r53>>>0){r87=HEAP32[r40+1];r88=r86+r87|0;if(r88>>>0>r53>>>0){break}}r55=HEAP32[r40+2],r40=r55>>2}r55=r86+(r87-39)|0;if((r55&7|0)==0){r89=0}else{r89=-r55&7}r55=r86+(r87-47)+r89|0;r40=r55>>>0<(r64+16|0)>>>0?r53:r55;r55=r40+8|0,r57=r55>>2;r39=r61+8|0;if((r39&7|0)==0){r90=0}else{r90=-r39&7}r39=r59-40-r90|0;HEAP32[1313055]=r61+r90|0;HEAP32[1313052]=r39;HEAP32[(r90+4>>2)+r62]=r39|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1313056]=HEAP32[1312859];HEAP32[r40+4>>2]=27;HEAP32[r57]=HEAP32[1313161];HEAP32[r57+1]=HEAP32[1313162];HEAP32[r57+2]=HEAP32[1313163];HEAP32[r57+3]=HEAP32[1313164];HEAP32[1313161]=r61;HEAP32[1313162]=r59;HEAP32[1313164]=0;HEAP32[1313163]=r55;r55=r40+28|0;HEAP32[r55>>2]=7;L581:do{if((r40+32|0)>>>0<r88>>>0){r57=r55;while(1){r39=r57+4|0;HEAP32[r39>>2]=7;if((r57+8|0)>>>0<r88>>>0){r57=r39}else{break L581}}}}while(0);if((r40|0)==(r53|0)){break}r55=r40-r64|0;r57=r55+(r53+4)|0;HEAP32[r57>>2]=HEAP32[r57>>2]&-2;HEAP32[r50+1]=r55|1;HEAP32[r53+r55>>2]=r55;r57=r55>>>3;if(r55>>>0<256){r39=r57<<1;r63=(r39<<2)+5252236|0;r56=HEAP32[1313049];r47=1<<r57;do{if((r56&r47|0)==0){HEAP32[1313049]=r56|r47;r91=r63;r92=(r39+2<<2)+5252236|0}else{r57=(r39+2<<2)+5252236|0;r49=HEAP32[r57>>2];if(r49>>>0>=HEAP32[1313053]>>>0){r91=r49;r92=r57;break}_abort()}}while(0);HEAP32[r92>>2]=r64;HEAP32[r91+12>>2]=r64;HEAP32[r50+2]=r91;HEAP32[r50+3]=r63;break}r39=r64;r47=r55>>>8;do{if((r47|0)==0){r93=0}else{if(r55>>>0>16777215){r93=31;break}r56=(r47+1048320|0)>>>16&8;r53=r47<<r56;r40=(r53+520192|0)>>>16&4;r57=r53<<r40;r53=(r57+245760|0)>>>16&2;r49=14-(r40|r56|r53)+(r57<<r53>>>15)|0;r93=r55>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r93<<2)+5252500|0;HEAP32[r50+7]=r93;HEAP32[r50+5]=0;HEAP32[r50+4]=0;r63=HEAP32[1313050];r49=1<<r93;if((r63&r49|0)==0){HEAP32[1313050]=r63|r49;HEAP32[r47>>2]=r39;HEAP32[r50+6]=r47;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}if((r93|0)==31){r94=0}else{r94=25-(r93>>>1)|0}r49=r55<<r94;r63=HEAP32[r47>>2];while(1){if((HEAP32[r63+4>>2]&-8|0)==(r55|0)){break}r95=(r49>>>31<<2)+r63+16|0;r47=HEAP32[r95>>2];if((r47|0)==0){r2=409;break}else{r49=r49<<1;r63=r47}}if(r2==409){if(r95>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r95>>2]=r39;HEAP32[r50+6]=r63;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}}r49=r63+8|0;r55=HEAP32[r49>>2];r47=HEAP32[1313053];if(r63>>>0<r47>>>0){_abort()}if(r55>>>0<r47>>>0){_abort()}else{HEAP32[r55+12>>2]=r39;HEAP32[r49>>2]=r39;HEAP32[r50+2]=r55;HEAP32[r50+3]=r63;HEAP32[r50+6]=0;break}}}while(0);r50=HEAP32[1313052];if(r50>>>0<=r15>>>0){break}r64=r50-r15|0;HEAP32[1313052]=r64;r50=HEAP32[1313055];r55=r50;HEAP32[1313055]=r55+r15|0;HEAP32[(r55+4>>2)+r16]=r64|1;HEAP32[r50+4>>2]=r15|3;r14=r50+8|0;return r14}}while(0);HEAP32[___errno_location()>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46;r2=r1>>2;r3=0;if((r1|0)==0){return}r4=r1-8|0;r5=r4;r6=HEAP32[1313053];if(r4>>>0<r6>>>0){_abort()}r7=HEAP32[r1-4>>2];r8=r7&3;if((r8|0)==1){_abort()}r9=r7&-8,r10=r9>>2;r11=r1+(r9-8)|0;r12=r11;L634:do{if((r7&1|0)==0){r13=HEAP32[r4>>2];if((r8|0)==0){return}r14=-8-r13|0,r15=r14>>2;r16=r1+r14|0;r17=r16;r18=r13+r9|0;if(r16>>>0<r6>>>0){_abort()}if((r17|0)==(HEAP32[1313054]|0)){r19=(r1+(r9-4)|0)>>2;if((HEAP32[r19]&3|0)!=3){r20=r17,r21=r20>>2;r22=r18;break}HEAP32[1313051]=r18;HEAP32[r19]=HEAP32[r19]&-2;HEAP32[r15+(r2+1)]=r18|1;HEAP32[r11>>2]=r18;return}r19=r13>>>3;if(r13>>>0<256){r13=HEAP32[r15+(r2+2)];r23=HEAP32[r15+(r2+3)];r24=(r19<<3)+5252236|0;do{if((r13|0)!=(r24|0)){if(r13>>>0<r6>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r17|0)){break}_abort()}}while(0);if((r23|0)==(r13|0)){HEAP32[1313049]=HEAP32[1313049]&(1<<r19^-1);r20=r17,r21=r20>>2;r22=r18;break}do{if((r23|0)==(r24|0)){r25=r23+8|0}else{if(r23>>>0<r6>>>0){_abort()}r26=r23+8|0;if((HEAP32[r26>>2]|0)==(r17|0)){r25=r26;break}_abort()}}while(0);HEAP32[r13+12>>2]=r23;HEAP32[r25>>2]=r13;r20=r17,r21=r20>>2;r22=r18;break}r24=r16;r19=HEAP32[r15+(r2+6)];r26=HEAP32[r15+(r2+3)];L668:do{if((r26|0)==(r24|0)){r27=r14+(r1+20)|0;r28=HEAP32[r27>>2];do{if((r28|0)==0){r29=r14+(r1+16)|0;r30=HEAP32[r29>>2];if((r30|0)==0){r31=0,r32=r31>>2;break L668}else{r33=r30;r34=r29;break}}else{r33=r28;r34=r27}}while(0);while(1){r27=r33+20|0;r28=HEAP32[r27>>2];if((r28|0)!=0){r33=r28;r34=r27;continue}r27=r33+16|0;r28=HEAP32[r27>>2];if((r28|0)==0){break}else{r33=r28;r34=r27}}if(r34>>>0<r6>>>0){_abort()}else{HEAP32[r34>>2]=0;r31=r33,r32=r31>>2;break}}else{r27=HEAP32[r15+(r2+2)];if(r27>>>0<r6>>>0){_abort()}r28=r27+12|0;if((HEAP32[r28>>2]|0)!=(r24|0)){_abort()}r29=r26+8|0;if((HEAP32[r29>>2]|0)==(r24|0)){HEAP32[r28>>2]=r26;HEAP32[r29>>2]=r27;r31=r26,r32=r31>>2;break}else{_abort()}}}while(0);if((r19|0)==0){r20=r17,r21=r20>>2;r22=r18;break}r26=r14+(r1+28)|0;r16=(HEAP32[r26>>2]<<2)+5252500|0;do{if((r24|0)==(HEAP32[r16>>2]|0)){HEAP32[r16>>2]=r31;if((r31|0)!=0){break}HEAP32[1313050]=HEAP32[1313050]&(1<<HEAP32[r26>>2]^-1);r20=r17,r21=r20>>2;r22=r18;break L634}else{if(r19>>>0<HEAP32[1313053]>>>0){_abort()}r13=r19+16|0;if((HEAP32[r13>>2]|0)==(r24|0)){HEAP32[r13>>2]=r31}else{HEAP32[r19+20>>2]=r31}if((r31|0)==0){r20=r17,r21=r20>>2;r22=r18;break L634}}}while(0);if(r31>>>0<HEAP32[1313053]>>>0){_abort()}HEAP32[r32+6]=r19;r24=HEAP32[r15+(r2+4)];do{if((r24|0)!=0){if(r24>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r32+4]=r24;HEAP32[r24+24>>2]=r31;break}}}while(0);r24=HEAP32[r15+(r2+5)];if((r24|0)==0){r20=r17,r21=r20>>2;r22=r18;break}if(r24>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r32+5]=r24;HEAP32[r24+24>>2]=r31;r20=r17,r21=r20>>2;r22=r18;break}}else{r20=r5,r21=r20>>2;r22=r9}}while(0);r5=r20,r31=r5>>2;if(r5>>>0>=r11>>>0){_abort()}r5=r1+(r9-4)|0;r32=HEAP32[r5>>2];if((r32&1|0)==0){_abort()}do{if((r32&2|0)==0){if((r12|0)==(HEAP32[1313055]|0)){r6=HEAP32[1313052]+r22|0;HEAP32[1313052]=r6;HEAP32[1313055]=r20;HEAP32[r21+1]=r6|1;if((r20|0)==(HEAP32[1313054]|0)){HEAP32[1313054]=0;HEAP32[1313051]=0}if(r6>>>0<=HEAP32[1313056]>>>0){return}_sys_trim(0);return}if((r12|0)==(HEAP32[1313054]|0)){r6=HEAP32[1313051]+r22|0;HEAP32[1313051]=r6;HEAP32[1313054]=r20;HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;return}r6=(r32&-8)+r22|0;r33=r32>>>3;L739:do{if(r32>>>0<256){r34=HEAP32[r2+r10];r25=HEAP32[((r9|4)>>2)+r2];r8=(r33<<3)+5252236|0;do{if((r34|0)!=(r8|0)){if(r34>>>0<HEAP32[1313053]>>>0){_abort()}if((HEAP32[r34+12>>2]|0)==(r12|0)){break}_abort()}}while(0);if((r25|0)==(r34|0)){HEAP32[1313049]=HEAP32[1313049]&(1<<r33^-1);break}do{if((r25|0)==(r8|0)){r35=r25+8|0}else{if(r25>>>0<HEAP32[1313053]>>>0){_abort()}r4=r25+8|0;if((HEAP32[r4>>2]|0)==(r12|0)){r35=r4;break}_abort()}}while(0);HEAP32[r34+12>>2]=r25;HEAP32[r35>>2]=r34}else{r8=r11;r4=HEAP32[r10+(r2+4)];r7=HEAP32[((r9|4)>>2)+r2];L760:do{if((r7|0)==(r8|0)){r24=r9+(r1+12)|0;r19=HEAP32[r24>>2];do{if((r19|0)==0){r26=r9+(r1+8)|0;r16=HEAP32[r26>>2];if((r16|0)==0){r36=0,r37=r36>>2;break L760}else{r38=r16;r39=r26;break}}else{r38=r19;r39=r24}}while(0);while(1){r24=r38+20|0;r19=HEAP32[r24>>2];if((r19|0)!=0){r38=r19;r39=r24;continue}r24=r38+16|0;r19=HEAP32[r24>>2];if((r19|0)==0){break}else{r38=r19;r39=r24}}if(r39>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r39>>2]=0;r36=r38,r37=r36>>2;break}}else{r24=HEAP32[r2+r10];if(r24>>>0<HEAP32[1313053]>>>0){_abort()}r19=r24+12|0;if((HEAP32[r19>>2]|0)!=(r8|0)){_abort()}r26=r7+8|0;if((HEAP32[r26>>2]|0)==(r8|0)){HEAP32[r19>>2]=r7;HEAP32[r26>>2]=r24;r36=r7,r37=r36>>2;break}else{_abort()}}}while(0);if((r4|0)==0){break}r7=r9+(r1+20)|0;r34=(HEAP32[r7>>2]<<2)+5252500|0;do{if((r8|0)==(HEAP32[r34>>2]|0)){HEAP32[r34>>2]=r36;if((r36|0)!=0){break}HEAP32[1313050]=HEAP32[1313050]&(1<<HEAP32[r7>>2]^-1);break L739}else{if(r4>>>0<HEAP32[1313053]>>>0){_abort()}r25=r4+16|0;if((HEAP32[r25>>2]|0)==(r8|0)){HEAP32[r25>>2]=r36}else{HEAP32[r4+20>>2]=r36}if((r36|0)==0){break L739}}}while(0);if(r36>>>0<HEAP32[1313053]>>>0){_abort()}HEAP32[r37+6]=r4;r8=HEAP32[r10+(r2+2)];do{if((r8|0)!=0){if(r8>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r37+4]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);r8=HEAP32[r10+(r2+3)];if((r8|0)==0){break}if(r8>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r37+5]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;if((r20|0)!=(HEAP32[1313054]|0)){r40=r6;break}HEAP32[1313051]=r6;return}else{HEAP32[r5>>2]=r32&-2;HEAP32[r21+1]=r22|1;HEAP32[(r22>>2)+r31]=r22;r40=r22}}while(0);r22=r40>>>3;if(r40>>>0<256){r31=r22<<1;r32=(r31<<2)+5252236|0;r5=HEAP32[1313049];r36=1<<r22;do{if((r5&r36|0)==0){HEAP32[1313049]=r5|r36;r41=r32;r42=(r31+2<<2)+5252236|0}else{r22=(r31+2<<2)+5252236|0;r37=HEAP32[r22>>2];if(r37>>>0>=HEAP32[1313053]>>>0){r41=r37;r42=r22;break}_abort()}}while(0);HEAP32[r42>>2]=r20;HEAP32[r41+12>>2]=r20;HEAP32[r21+2]=r41;HEAP32[r21+3]=r32;return}r32=r20;r41=r40>>>8;do{if((r41|0)==0){r43=0}else{if(r40>>>0>16777215){r43=31;break}r42=(r41+1048320|0)>>>16&8;r31=r41<<r42;r36=(r31+520192|0)>>>16&4;r5=r31<<r36;r31=(r5+245760|0)>>>16&2;r22=14-(r36|r42|r31)+(r5<<r31>>>15)|0;r43=r40>>>((r22+7|0)>>>0)&1|r22<<1}}while(0);r41=(r43<<2)+5252500|0;HEAP32[r21+7]=r43;HEAP32[r21+5]=0;HEAP32[r21+4]=0;r22=HEAP32[1313050];r31=1<<r43;do{if((r22&r31|0)==0){HEAP32[1313050]=r22|r31;HEAP32[r41>>2]=r32;HEAP32[r21+6]=r41;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20}else{if((r43|0)==31){r44=0}else{r44=25-(r43>>>1)|0}r5=r40<<r44;r42=HEAP32[r41>>2];while(1){if((HEAP32[r42+4>>2]&-8|0)==(r40|0)){break}r45=(r5>>>31<<2)+r42+16|0;r36=HEAP32[r45>>2];if((r36|0)==0){r3=588;break}else{r5=r5<<1;r42=r36}}if(r3==588){if(r45>>>0<HEAP32[1313053]>>>0){_abort()}else{HEAP32[r45>>2]=r32;HEAP32[r21+6]=r42;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20;break}}r5=r42+8|0;r6=HEAP32[r5>>2];r36=HEAP32[1313053];if(r42>>>0<r36>>>0){_abort()}if(r6>>>0<r36>>>0){_abort()}else{HEAP32[r6+12>>2]=r32;HEAP32[r5>>2]=r32;HEAP32[r21+2]=r6;HEAP32[r21+3]=r42;HEAP32[r21+6]=0;break}}}while(0);r21=HEAP32[1313057]-1|0;HEAP32[1313057]=r21;if((r21|0)==0){r46=5252652}else{return}while(1){r21=HEAP32[r46>>2];if((r21|0)==0){break}else{r46=r21+8|0}}HEAP32[1313057]=-1;return}function _sys_trim(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;do{if((HEAP32[1312855]|0)==0){r2=_sysconf(8);if((r2-1&r2|0)==0){HEAP32[1312857]=r2;HEAP32[1312856]=r2;HEAP32[1312858]=-1;HEAP32[1312859]=2097152;HEAP32[1312860]=0;HEAP32[1313160]=0;HEAP32[1312855]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);if(r1>>>0>=4294967232){r3=0;r4=r3&1;return r4}r2=HEAP32[1313055];if((r2|0)==0){r3=0;r4=r3&1;return r4}r5=HEAP32[1313052];do{if(r5>>>0>(r1+40|0)>>>0){r6=HEAP32[1312857];r7=Math.imul(Math.floor(((-40-r1-1+r5+r6|0)>>>0)/(r6>>>0))-1|0,r6);r8=r2;r9=5252644,r10=r9>>2;while(1){r11=HEAP32[r10];if(r11>>>0<=r8>>>0){if((r11+HEAP32[r10+1]|0)>>>0>r8>>>0){r12=r9;break}}r11=HEAP32[r10+2];if((r11|0)==0){r12=0;break}else{r9=r11,r10=r9>>2}}if((HEAP32[r12+12>>2]&8|0)!=0){break}r9=_sbrk(0);r10=(r12+4|0)>>2;if((r9|0)!=(HEAP32[r12>>2]+HEAP32[r10]|0)){break}r8=_sbrk(-(r7>>>0>2147483646?-2147483648-r6|0:r7)|0);r11=_sbrk(0);if(!((r8|0)!=-1&r11>>>0<r9>>>0)){break}r8=r9-r11|0;if((r9|0)==(r11|0)){break}HEAP32[r10]=HEAP32[r10]-r8|0;HEAP32[1313157]=HEAP32[1313157]-r8|0;r10=HEAP32[1313055];r13=HEAP32[1313052]-r8|0;r8=r10;r14=r10+8|0;if((r14&7|0)==0){r15=0}else{r15=-r14&7}r14=r13-r15|0;HEAP32[1313055]=r8+r15|0;HEAP32[1313052]=r14;HEAP32[r15+(r8+4)>>2]=r14|1;HEAP32[r13+(r8+4)>>2]=40;HEAP32[1313056]=HEAP32[1312859];r3=(r9|0)!=(r11|0);r4=r3&1;return r4}}while(0);if(HEAP32[1313052]>>>0<=HEAP32[1313056]>>>0){r3=0;r4=r3&1;return r4}HEAP32[1313056]=-1;r3=0;r4=r3&1;return r4}
// EMSCRIPTEN_END_FUNCS
Module["_init"] = _init;
Module["_decode_frame"] = _decode_frame;
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    var ret = 0;
    calledRun = true;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
(function() {
function assert(check, msg) {
  if (!check) throw msg + new Error().stack;
}
})();
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
initRuntime();
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
if (shouldRunNow) {
  run();
}
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}