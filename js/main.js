var Maze,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Maze = (function() {
  function Maze(width, height) {
    this.width = width;
    this.height = height;
    this.getPath = bind(this.getPath, this);
    this.isPassable = bind(this.isPassable, this);
    this.scroll = bind(this.scroll, this);
    this.click = bind(this.click, this);
    this.setExit = bind(this.setExit, this);
    this.setEntry = bind(this.setEntry, this);
    this.toggle = bind(this.toggle, this);
    this.set = bind(this.set, this);
    this.is = bind(this.is, this);
    this.get = bind(this.get, this);
    this.cells = [[]];
    this.entry = [0, 0];
    this.exit = [this.width - 1, this.height - 1];
  }

  Maze.prototype.get = function(at) {
    var B, H, L, R, T, V, ref, ref1, tile, x, y;
    x = at[0], y = at[1];
    tile = (this.cells[x] || [])[y] || {};
    ref = [(0 <= x && x < this.width), (0 <= y && y < this.height)], H = ref[0], V = ref[1];
    ref1 = [x === -1, x === this.width, y === -1, y === this.height], L = ref1[0], R = ref1[1], T = ref1[2], B = ref1[3];
    return $.extend(tile, {
      inside: H && V,
      border: ((L || R) && V) || ((T || B) && H),
      corner: (L || R) && (T || B),
      edges: {
        left: L,
        right: R,
        top: T,
        bottom: B
      },
      entry: x === this.entry[0] && y === this.entry[1],
      exit: x === this.exit[0] && y === this.exit[1]
    });
  };

  Maze.prototype.is = function(at, attrs) {
    var a, tile;
    tile = this.get(at);
    for (a in attrs) {
      if (tile[a] || attrs[a]) {
        if (tile[a] !== attrs[a]) {
          return false;
        }
      }
    }
    return true;
  };

  Maze.prototype.set = function(at, attrs) {
    var a, base, tile, x, y;
    if (!this.is(at, {
      inside: true
    })) {
      return;
    }
    x = at[0], y = at[1];
    tile = ((base = this.cells)[x] != null ? base[x] : base[x] = [])[y] || {};
    for (a in attrs) {
      tile[a] = attrs[a];
    }
    return this.cells[x][y] = tile;
  };

  Maze.prototype.toggle = function(at, attr) {
    var ret, tog;
    if (!this.is(at, {
      inside: true
    })) {
      return;
    }
    tog = {};
    ret = tog[attr] = !this.get(at)[attr];
    this.set(at, tog);
    return ret;
  };

  Maze.prototype.setEntry = function(at) {
    if (this.is(at, {
      inside: true,
      exit: false
    })) {
      return this.entry = at;
    }
  };

  Maze.prototype.setExit = function(at) {
    if (this.is(at, {
      inside: true,
      entry: false
    })) {
      return this.exit = at;
    }
  };

  Maze.prototype.click = function(at, metac) {
    var ac, locked, obstacle, special, walkable;
    if (!this.is(at, {
      inside: true
    })) {
      return;
    }
    switch (metac) {
      case 1:
        walkable = this.toggle(at, "walkable");
        ac = walkable ? "Set" : "Unset";
        alert(ac + " walkable at " + at);
        break;
      case 2:
        special = ((this.get(at).special || 0) + 1) % 32;
        this.set(at, {
          special: special
        });
        alert("Set sprite index to " + special + " at " + at);
        break;
      case 3:
        locked = this.toggle(at, "locked");
        ac = locked ? "Lock" : "Unlock";
        alert(ac + " tile at " + at);
        break;
      default:
        obstacle = this.toggle(at, "obstacle");
        ac = obstacle ? "Put" : "Clear";
        alert(ac + " obstacle at " + at);
    }
    return true;
  };

  Maze.prototype.scroll = function(at, delta) {
    var dir, special;
    dir = delta > 0 ? 1 : -1;
    special = ((this.get(at).special || 0) + dir) % 32;
    if (special < 0) {
      special += 32;
    }
    return this.set(at, {
      special: special
    });
  };

  Maze.prototype.isPassable = function(at) {
    var tile;
    tile = this.get(at);
    if (!tile.inside) {
      return false;
    }
    if (tile.entry || tile.exit) {
      return true;
    }
    return !tile.obstacle;
  };

  Maze.prototype.getPath = function(from, dir) {
    var next, path;
    path = [from];
    while (true) {
      next = this.getNext(from, dir);
      if (!this.isPassable(next)) {
        break;
      }
      path.push(next);
      if (this.is(next, {
        walkable: true
      })) {
        break;
      }
      from = next;
    }
    return path;
  };

  Maze.prototype.getNext = function(from, dir, dist) {
    if (dist == null) {
      dist = 1;
    }
    switch (dir) {
      case "left":
        return [from[0] - dist, from[1]];
      case "up":
        return [from[0], from[1] - dist];
      case "right":
        return [from[0] + dist, from[1]];
      case "down":
        return [from[0], from[1] + dist];
      default:
        throw "Unrecognized direction " + dir;
    }
  };

  Maze.prototype.getRelativeDirection = function(a, b) {
    return {
      left: a[0] < b[0],
      right: a[0] > b[0],
      up: a[1] < b[1],
      down: a[1] > b[1]
    };
  };

  return Maze;

})();

var currMaze, currMode, currPPost, currTheme, handleClick, handleKeydown, handleScroll, resetGame, resumeGame, setMaze, setMode, setTheme, winGame;

currMaze = null;

currMode = null;

currTheme = null;

currPPost = null;

setMaze = function(maze) {
  if (maze) {
    currMaze = maze;
  }
  if (currTheme != null) {
    currTheme.prep({
      maze: currMaze
    });
  }
  refitUI();
  return resetGame();
};

setMode = function(mode) {
  if (currMode === mode) {
    return;
  }
  if (mode === "edit" || mode === "play") {
    alert("Begin " + mode + " mode");
  } else {
    return alert("Mode[" + mode + "] is undefined");
  }
  if (mode) {
    currMode = mode;
  }
  if (currTheme != null) {
    currTheme.prep({
      mode: currMode
    });
  }
  setUIMode(currMode);
  return resetGame();
};

setTheme = function(thID) {
  var th;
  if (th = themes[thID]) {
    alert("Theme: " + th[0]);
  } else {
    return alert("Theme[" + thID + "] is undefined");
  }
  if (currTheme != null) {
    currTheme.stop();
  }
  currTheme = th[1];
  currTheme.prep({
    c2d: $maze[0].getContext("2d"),
    el: $maze[0],
    maze: currMaze,
    mode: currMode
  });
  refitUI();
  return resumeGame();
};

resetGame = function() {
  if (currTheme != null) {
    currTheme.stop();
  }
  if (currMode === "play") {
    currPPost = currMaze.entry;
    alert("Begin game at " + currPPost);
  }
  return resumeGame();
};

resumeGame = function() {
  if (currTheme != null) {
    currTheme.stop();
  }
  if (currTheme != null) {
    currTheme.clearCanvas();
  }
  if (currTheme != null) {
    currTheme.resume();
  }
  if (currMode === "play") {
    return currTheme != null ? currTheme.drawMove(currPPost, "down") : void 0;
  }
};

winGame = function() {
  if (!currTheme.fanfare()) {
    return alert("WIN!");
  }
};

handleClick = function(ev) {
  var edat, metaCount, offs, relX, relY;
  ev.preventDefault();
  if (currMode !== "edit") {
    return;
  }
  offs = $maze.offset();
  relX = ev.pageX - offs.left;
  relY = ev.pageY - offs.top;
  edat = currTheme.at(relX, relY);
  metaCount = ev.altKey + ev.ctrlKey + ev.shiftKey;
  currMaze.click(edat, metaCount);
  return currTheme.redraw(edat);
};

handleScroll = function(ev, delta) {
  var edat, offs, relX, relY;
  ev.preventDefault();
  if (currMode !== "edit") {
    return;
  }
  offs = $maze.offset();
  relX = ev.pageX - offs.left;
  relY = ev.pageY - offs.top;
  edat = currTheme.at(relX, relY);
  currMaze.scroll(edat, delta);
  return currTheme.redraw(edat);
};

handleKeydown = function(ev) {
  var direction, dirkeys, endpoint, path, winner;
  if (currMode !== "play") {
    return;
  }
  if (currTheme.busy()) {
    return;
  }
  dirkeys = {
    37: "left",
    38: "up",
    39: "right",
    40: "down"
  };
  direction = dirkeys[ev.which];
  if (!direction) {
    return;
  }
  path = currMaze.getPath(currPPost, direction);
  endpoint = path[path.length - 1];
  winner = currMaze.is(endpoint, {
    exit: true
  });
  return currTheme.drawMove(currPPost, direction, path, (function(_this) {
    return function() {
      currPPost = endpoint;
      if (winner) {
        return winGame();
      }
    };
  })(this));
};

var decodeMaze, encodeMaze;

encodeMaze = function(maze) {
  var data, j, k, props, ref, ref1, tile, x, y;
  data = [maze.width, maze.height, maze.entry[0], maze.entry[1], maze.exit[0], maze.exit[1]];
  for (x = j = 0, ref = maze.width - 1; 0 <= ref ? j <= ref : j >= ref; x = 0 <= ref ? ++j : --j) {
    for (y = k = 0, ref1 = maze.height - 1; 0 <= ref1 ? k <= ref1 : k >= ref1; y = 0 <= ref1 ? ++k : --k) {
      tile = maze.get([x, y]);
      props = (tile.special || 0) & 31;
      if (tile.locked) {
        props |= 1 << 7;
      }
      if (tile.obstacle) {
        props |= 1 << 6;
      }
      if (tile.walkable) {
        props |= 1 << 5;
      }
      data.push(props);
    }
  }
  return window.btoa(String.fromCharCode.apply(String, data));
};

decodeMaze = function(data) {
  var i, j, k, maze, props, ref, ref1, x, y;
  data = window.atob(data);
  i = 0;
  maze = new Maze(data.charCodeAt(i++), data.charCodeAt(i++));
  maze.entry = [data.charCodeAt(i++), data.charCodeAt(i++)];
  maze.exit = [data.charCodeAt(i++), data.charCodeAt(i++)];
  for (x = j = 0, ref = maze.width - 1; 0 <= ref ? j <= ref : j >= ref; x = 0 <= ref ? ++j : --j) {
    for (y = k = 0, ref1 = maze.height - 1; 0 <= ref1 ? k <= ref1 : k >= ref1; y = 0 <= ref1 ? ++k : --k) {
      props = data.charCodeAt(i++);
      maze.set([x, y], {
        special: props & 31,
        locked: (props & (1 << 7)) > 0,
        obstacle: (props & (1 << 6)) > 0,
        walkable: (props & (1 << 5)) > 0
      });
    }
  }
  return maze;
};

var $editClearLocks, $editClearSprites, $editMenu, $editMode, $editShowSolns, $examplesList, $info, $loadDecode, $loadDecodeInput, $loadDecodeModal, $loadDecodeSubmit, $loadSavedList, $maze, $menu, $newMaze, $newMazeHeight, $newMazeModal, $newMazeWidth, $playMenu, $playMode, $playRestart, $print, $saveAs, $saveEncode, $saveEncodeModal, $saveEncodeOutput, $saveOverList, $themesList, $win, $wrap, loadExamplesMenu, loadStorageMenus, loadThemesMenu, refitUI, setUIMode;

$win = $(window);

$menu = $("#menu");

$wrap = $("#wrap");

$maze = $("#maze");

$info = $("#info");

$newMaze = $("#newMaze");

$newMazeWidth = $("#newMazeWidth");

$newMazeHeight = $("#newMazeHeight");

$newMazeModal = $("#newMazeModal");

$examplesList = $("ul", "#examplesMenu");

$loadSavedList = $("ul", "#loadSavedMenu");

$loadDecode = $("#loadDecode");

$loadDecodeInput = $("#ioTextarea");

$loadDecodeModal = $("#ioModal");

$loadDecodeSubmit = $("#ioDecode");

$saveAs = $("#saveAs");

$saveOverList = $("ul", "#saveOverMenu");

$saveEncode = $("#saveEncode");

$saveEncodeOutput = $("#ioTextarea");

$saveEncodeModal = $("#ioModal");

$themesList = $("ul", "#themesMenu");

$print = $("#print");

$editMode = $("#editMode, #yayGoEdit");

$editMenu = $("#editMenu");

$editShowSolns = $("#editShowSolns");

$editClearLocks = $("#editClearLocks");

$editClearSprites = $("#editClearSpecials");

$playMode = $("#playMode, #yayGoPlay");

$playMenu = $("#playMenu");

$playRestart = $("#playRestart");

refitUI = function() {
  var mazeHeight, mazeWidth, menuHeight, overH, overW, ref, windowHeight, windowWidth, wrapHeight, wrapWidth;
  windowWidth = $win.width();
  windowHeight = $win.height();
  menuHeight = $menu.outerHeight(true);
  wrapWidth = windowWidth;
  wrapHeight = windowHeight - menuHeight;
  $wrap.css("margin-top", menuHeight);
  $wrap.height(wrapHeight).width(wrapWidth);
  if (!currTheme) {
    return;
  }
  ref = currTheme.resize([wrapWidth, wrapHeight]), mazeWidth = ref[0], mazeHeight = ref[1];
  $maze.attr("width", mazeWidth).attr("height", mazeHeight);
  overW = mazeWidth > wrapWidth;
  overH = mazeHeight > wrapHeight;
  $maze.css({
    position: "relative"
  }, {
    left: (overW ? 0 : Math.floor((wrapWidth - mazeWidth) / 2)) + "px",
    top: (overH ? 0 : Math.floor((wrapHeight - mazeHeight) / 2)) + "px"
  });
  $wrap.css("overflow-x", overW ? "scroll" : "hidden");
  $wrap.css("overflow-y", overH ? "scroll" : "hidden");
};

setUIMode = function(mode) {
  switch (mode) {
    case "edit":
      $editMode.addClass("active");
      $editMenu.show();
      $playMode.removeClass("active");
      $playMenu.hide();
      break;
    case "play":
      $playMode.addClass("active");
      $playMenu.show();
      $editMode.removeClass("active");
      $editMenu.hide();
  }
};

loadThemesMenu = function(themes, active) {
  var id, refocus, th;
  $themesList.empty();
  refocus = function(i) {
    return function() {
      $themesList.find("li.active").removeClass("active");
      $themesList.find("li[themeID='" + i + "']").addClass("active");
      return setTheme(i);
    };
  };
  for (id in themes) {
    th = themes[id];
    $("<li><a tabindex='-1' href='#'>" + th[0] + "</a></li>").attr("themeID", id).addClass(id === active ? "active" : "").appendTo($themesList).on("click", refocus(id));
  }
};

loadExamplesMenu = function(examples) {
  var eg, handler, id;
  $examplesList.empty();
  handler = function(i) {
    return function() {
      return loadExample(i);
    };
  };
  for (id in examples) {
    eg = examples[id];
    $("<li><a tabindex='-1' href='#'>" + eg[0] + "</a></li>").attr("egID", id).appendTo($examplesList).on("click", handler(id));
  }
};

loadStorageMenus = function() {
  var id, some;
  $loadSavedList.empty();
  $saveOverList.empty();
  some = false;
  for (id in mazes) {
    some = true;
    $("<li><a tabindex='-1' href='#'>" + id + "</a></li>").appendTo($loadSavedList).on("click", (function(i) {
      return function() {
        return loadMaze(i);
      };
    })(id)).clone().appendTo($saveOverList).on("click", (function(i) {
      return function() {
        return saveOverwrite(i);
      };
    })(id));
  }
  if (!some) {
    $("<li><a tabindex='-1' href='#'>None</a></li>").addClass("disabled").appendTo($loadSavedList).clone().appendTo($saveOverList);
  }
};

window.alert = function(message, timeout) {
  var $m, fadeRemove;
  if (timeout == null) {
    timeout = 2000;
  }
  $m = $("<p/>").text(message).appendTo($info);
  fadeRemove = function() {
    return $m.fadeOut("slow", function() {
      return $m.remove();
    });
  };
  $m.on("click", fadeRemove);
  return setTimeout(fadeRemove, timeout);
};

var startAnim;

(function() {
  var i, lastTime, len, ref, v;
  ref = ['ms', 'moz', 'webkit', 'o'];
  for (i = 0, len = ref.length; i < len; i++) {
    v = ref[i];
    if (window.requestAnimationFrame == null) {
      window.requestAnimationFrame = window[v + "RequestAnimationFrame"];
    }
    if (window.cancelAnimationFrame == null) {
      window.cancelAnimationFrame = window[v + "CancelAnimationFrame"] || window[v + "CancelRequestAnimationFrame"];
    }
  }
  lastTime = 0;
  if (window.requestAnimationFrame == null) {
    window.requestAnimationFrame = function(cb, el) {
      var currTime, timeToCall;
      currTime = (new Date).getTime();
      timeToCall = Math.max(0, 16 - (currTime - lastTime));
      lastTime = currTime + timeToCall;
      return window.setTimeout((function() {
        return cb(currTime + timeToCall);
      }), timeToCall);
    };
  }
  return window.cancelAnimationFrame != null ? window.cancelAnimationFrame : window.cancelAnimationFrame = function(an) {
    return window.clearTimeout(an);
  };
})();

startAnim = function(fn, cb, el) {
  var controls, currAnim, done, initTime, next, step;
  initTime = null;
  currAnim = null;
  done = false;
  controls = {
    busy: function() {
      return !done;
    },
    stop: function() {
      if (!done) {
        this.cancel();
        if (cb) {
          return cb();
        }
      }
    },
    cancel: function() {
      done = true;
      return window.cancelAnimationFrame(currAnim);
    }
  };
  next = function() {
    return currAnim = window.requestAnimationFrame(step, el);
  };
  step = function(currTime) {
    if (!done) {
      if (initTime == null) {
        initTime = currTime;
      }
      if (fn(currTime - initTime, controls)) {
        return next();
      } else {
        return controls.stop();
      }
    }
  };
  next();
  return controls;
};

var Theme, registerTheme, themes,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

themes = {};

registerTheme = function(id, title, theme) {
  return themes[id] = [title, theme];
};

Theme = (function() {
  Theme.prototype.images = {};

  Theme.prototype.fanfare = function() {
    return false;
  };

  Theme.prototype.canvasSize = [0, 0];

  Theme.prototype.themeReady = false;

  Theme.prototype.themeOnAir = false;

  Theme.prototype.currAnim = null;

  function Theme(cbReady, cbError) {
    this.traceCircle = bind(this.traceCircle, this);
    this.traceRounded = bind(this.traceRounded, this);
    this.traceRect = bind(this.traceRect, this);
    this.stroke = bind(this.stroke, this);
    this.fill = bind(this.fill, this);
    this.fillCanvas = bind(this.fillCanvas, this);
    this.clearCanvas = bind(this.clearCanvas, this);
    this.resize = bind(this.resize, this);
    this.resume = bind(this.resume, this);
    this.stop = bind(this.stop, this);
    this.busy = bind(this.busy, this);
    this.anim = bind(this.anim, this);
    this.prep = bind(this.prep, this);
    this.fanfare = bind(this.fanfare, this);
    var allReady, i, img, imgFailed, imgFile, imgID, imgLoaded, ref, remaining;
    allReady = (function(_this) {
      return function() {
        _this.themeReady = true;
        if (cbReady) {
          return cbReady();
        }
      };
    })(this);
    remaining = 0;
    for (i in this.images) {
      remaining++;
    }
    if (remaining === 0) {
      return allReady();
    }
    imgLoaded = (function(_this) {
      return function(src) {
        return function() {
          if (--remaining === 0) {
            return allReady();
          }
        };
      };
    })(this);
    imgFailed = (function(_this) {
      return function(src) {
        return function() {
          if (cbError) {
            return cbError("Failed to load " + src);
          }
        };
      };
    })(this);
    ref = this.images;
    for (imgID in ref) {
      imgFile = ref[imgID];
      img = new Image();
      img.onload = imgLoaded(imgFile);
      img.onerror = imgFailed(imgFile);
      img.src = imgFile;
      this.images[imgID] = img;
    }
    return;
  }

  Theme.prototype.prep = function(attrs) {
    this.stop();
    if (attrs.c2d != null) {
      this.c2d = attrs.c2d;
    }
    if (attrs.el) {
      this.el = attrs.el;
    }
    if (attrs.maze != null) {
      this.maze = attrs.maze;
    }
    if (attrs.mode != null) {
      return this.mode = attrs.mode;
    }
  };

  Theme.prototype.anim = function(cb, fn) {
    this.stop();
    this.resume();
    return this.currAnim = startAnim(fn, cb, this.el);
  };

  Theme.prototype.busy = function() {
    var ref;
    return (ref = this.currAnim) != null ? ref.busy() : void 0;
  };

  Theme.prototype.stop = function() {
    var ref;
    this.themeOnAir = false;
    return (ref = this.currAnim) != null ? ref.cancel() : void 0;
  };

  Theme.prototype.resume = function() {
    this.themeOnAir = true;
    return this.redraw();
  };

  Theme.prototype.resize = function(min) {
    var h1, h2, max, ref, w1, w2;
    w1 = min[0], h1 = min[1];
    ref = this.size(), w2 = ref[0], h2 = ref[1];
    max = function(a, b) {
      if (a > b) {
        return a;
      } else {
        return b;
      }
    };
    return this.canvasSize = [max(w1, w2), max(h1, h2)];
  };

  Theme.prototype.clearCanvas = function() {
    return this.c2d.clearRect(0, 0, this.canvasSize[0], this.canvasSize[1]);
  };

  Theme.prototype.fillCanvas = function(style) {
    this.c2d.fillStyle = style;
    return this.c2d.fillRect(0, 0, this.canvasSize[0], this.canvasSize[1]);
  };

  Theme.prototype.fill = function(sty) {
    this.c2d.fillStyle = sty;
    return this.c2d.fill();
  };

  Theme.prototype.stroke = function(wid, sty) {
    this.c2d.lineWidth = wid;
    this.c2d.strokeStyle = sty;
    return this.c2d.stroke();
  };

  Theme.prototype.traceRect = function(x, y, w, h) {
    this.c2d.beginPath();
    this.c2d.rect(x, y, w, h);
    return this.c2d.closePath();
  };

  Theme.prototype.traceRounded = function(x, y, w, h, r) {
    this.c2d.beginPath();
    this.c2d.moveTo(x + r, y);
    this.c2d.lineTo(x + w - r, y);
    this.c2d.quadraticCurveTo(x + w, y, x + w, y + r);
    this.c2d.lineTo(x + w, y + h - r);
    this.c2d.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.c2d.lineTo(x + r, y + h);
    this.c2d.quadraticCurveTo(x, y + h, x, y + h - r);
    this.c2d.lineTo(x, y + r);
    this.c2d.quadraticCurveTo(x, y, x + r, y);
    return this.c2d.closePath();
  };

  Theme.prototype.traceCircle = function(x, y, r) {
    this.c2d.beginPath();
    this.c2d.arc(x, y, r, 0, Math.PI * 2, false);
    return this.c2d.closePath();
  };

  return Theme;

})();

var ThemeTopdown,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

ThemeTopdown = (function(superClass) {
  extend(ThemeTopdown, superClass);

  ThemeTopdown.prototype.images = {};

  ThemeTopdown.prototype.frames = {};

  ThemeTopdown.prototype.sprites = {};

  function ThemeTopdown(arg) {
    var onError, onReady;
    this.tileSize = arg.tileSize, this.marginSize = arg.marginSize, onReady = arg.onReady, onError = arg.onError;
    this.drawFrame = bind(this.drawFrame, this);
    this.drawSprite = bind(this.drawSprite, this);
    this.traceCircleTile = bind(this.traceCircleTile, this);
    this.traceRoundedTile = bind(this.traceRoundedTile, this);
    this.traceSquareTile = bind(this.traceSquareTile, this);
    this.clearTile = bind(this.clearTile, this);
    this.redraw = bind(this.redraw, this);
    this.draw = bind(this.draw, this);
    this.at = bind(this.at, this);
    this.offs = bind(this.offs, this);
    this.size = bind(this.size, this);
    ThemeTopdown.__super__.constructor.call(this, onReady, onError);
  }

  ThemeTopdown.prototype.size = function() {
    var drawH, drawW, m, mazeH, mazeW, ref, ref1;
    m = this.marginSize * 2;
    mazeW = ((ref = this.maze) != null ? ref.width : void 0) || 0;
    mazeH = ((ref1 = this.maze) != null ? ref1.height : void 0) || 0;
    drawW = mazeW * this.tileSize;
    drawH = mazeH * this.tileSize;
    return [drawW + m, drawH + m];
  };

  ThemeTopdown.prototype.offs = function() {
    var minDrawingSize, xoff, yoff;
    minDrawingSize = this.size();
    xoff = Math.floor((this.canvasSize[0] - minDrawingSize[0]) / 2);
    yoff = Math.floor((this.canvasSize[1] - minDrawingSize[1]) / 2);
    return [xoff + this.marginSize, yoff + this.marginSize];
  };

  ThemeTopdown.prototype.at = function(canvasX, canvasY) {
    var offs, tileX, tileY;
    offs = this.offs();
    tileX = Math.floor((canvasX - offs[0]) / this.tileSize);
    tileY = Math.floor((canvasY - offs[1]) / this.tileSize);
    return [tileX, tileY];
  };

  ThemeTopdown.prototype.draw = function() {
    var positions;
    positions = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return this.redraw.apply(this, positions);
  };

  ThemeTopdown.prototype.redraw = function() {
    var at, canvas, h, i, j, k, len, offs, origin, positions, ref, ref1, ref2, ref3, ref4, transDraw, w, x, y;
    positions = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if ((this.maze != null) && this.themeOnAir) {
      offs = this.offs();
      transDraw = (function(_this) {
        return function(at) {
          _this.c2d.save();
          _this.c2d.translate(offs[0] + (at[0] * _this.tileSize), offs[1] + (at[1] * _this.tileSize));
          _this.clearTile();
          _this.drawTile(_this.maze.get(at));
          return _this.c2d.restore();
        };
      })(this);
      if (positions.length > 0) {
        for (i = 0, len = positions.length; i < len; i++) {
          at = positions[i];
          transDraw(at);
        }
      } else {
        this.clearCanvas();
        origin = [-Math.ceil(offs[0] / this.tileSize), -Math.ceil(offs[1] / this.tileSize)];
        canvas = [Math.ceil(this.canvasSize[0] / this.tileSize), Math.ceil(this.canvasSize[1] / this.tileSize)];
        ref = [canvas[0] + origin[0], canvas[1] + origin[1]], w = ref[0], h = ref[1];
        for (y = j = ref1 = origin[1], ref2 = h; ref1 <= ref2 ? j <= ref2 : j >= ref2; y = ref1 <= ref2 ? ++j : --j) {
          for (x = k = ref3 = origin[0], ref4 = w; ref3 <= ref4 ? k <= ref4 : k >= ref4; x = ref3 <= ref4 ? ++k : --k) {
            transDraw([x, y]);
          }
        }
      }
    }
  };

  ThemeTopdown.prototype.clearTile = function() {
    return this.c2d.clearRect(0, 0, this.tileSize, this.tileSize);
  };

  ThemeTopdown.prototype.traceSquareTile = function(psize) {
    var wh, xy;
    wh = this.tileSize * psize;
    xy = (this.tileSize - wh) / 2;
    return this.traceRect(xy, xy, wh, wh);
  };

  ThemeTopdown.prototype.traceRoundedTile = function(psize, prad) {
    var radius, wh, xy;
    wh = this.tileSize * psize;
    xy = (this.tileSize - wh) / 2;
    radius = wh * prad;
    return this.traceRounded(xy, xy, wh, wh, radius);
  };

  ThemeTopdown.prototype.traceCircleTile = function(psize) {
    var wh, xy;
    wh = this.tileSize * psize;
    xy = this.tileSize / 2;
    return this.traceCircle(xy, xy, wh / 2);
  };

  ThemeTopdown.prototype.drawSprite = function(spriteID, frame, time) {
    var frID, frIDs, frames, i, len, sprite;
    if (frame == null) {
      frame = 0;
    }
    if (time == null) {
      time = 0;
    }
    sprite = this.sprites[spriteID];
    frames = sprite.length - 1;
    time *= $.isNumeric(sprite[0]) ? sprite[0] : 1;
    frame += Math.ceil(time);
    frIDs = sprite[1 + (frame % (sprite.length - 1))];
    if ($.isArray(frIDs)) {
      for (i = 0, len = frIDs.length; i < len; i++) {
        frID = frIDs[i];
        this.drawFrame(frID);
      }
    } else {
      this.drawFrame(frIDs);
    }
  };

  ThemeTopdown.prototype.drawFrame = function(frameID) {
    var frame;
    frame = this.frames[frameID];
    return this.c2d.drawImage(this.images[frame[0]], frame[1], frame[2], frame[3], frame[4], 0, 0, this.tileSize, this.tileSize);
  };

  return ThemeTopdown;

})(Theme);

var ThemeBasic,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ThemeBasic = (function(superClass) {
  extend(ThemeBasic, superClass);

  function ThemeBasic() {
    this.drawMove = bind(this.drawMove, this);
    this.drawSolns = bind(this.drawSolns, this);
    this.drawTile = bind(this.drawTile, this);
    ThemeBasic.__super__.constructor.call(this, {
      tileSize: 30,
      marginSize: 15
    });
  }

  ThemeBasic.prototype.bgColour = "white";

  ThemeBasic.prototype.bgLockColour = "yellow";

  ThemeBasic.prototype.editTileSize = .9;

  ThemeBasic.prototype.playTileSize = 1;

  ThemeBasic.prototype.iceColour = "lightblue";

  ThemeBasic.prototype.dirtColour = "tan";

  ThemeBasic.prototype.rockTileSize = .75;

  ThemeBasic.prototype.rockRadiusSize = .1;

  ThemeBasic.prototype.rockColour = "gray";

  ThemeBasic.prototype.eeCircleSize = .65;

  ThemeBasic.prototype.entryColour = "rgb(0,200,100)";

  ThemeBasic.prototype.exitColour = "rgb(255,100,0)";

  ThemeBasic.prototype.eeInnerSize = .4;

  ThemeBasic.prototype.eeInnerColour = "white";

  ThemeBasic.prototype.avCircleSize = .5;

  ThemeBasic.prototype.avCircleColour = "black";

  ThemeBasic.prototype.avInnerSize = .4;

  ThemeBasic.prototype.avInnerColour = "red";

  ThemeBasic.prototype.animOneStepMS = 50;

  ThemeBasic.prototype.drawTile = function(tile) {
    if (!tile.inside) {
      return;
    }
    this.traceSquareTile(1);
    this.fill(tile.locked ? this.bgLockColour : this.bgColour);
    this.traceSquareTile(this.mode === "edit" ? this.editTileSize : this.playTileSize);
    this.fill(tile.walkable ? this.dirtColour : this.iceColour);
    if (tile.obstacle) {
      this.traceRoundedTile(this.rockTileSize, this.rockRadiusSize);
      this.fill(this.rockColour);
    }
    if (tile.entry || tile.exit) {
      this.traceCircleTile(this.eeCircleSize);
      this.fill(tile.entry ? this.entryColour : this.exitColour);
      this.traceCircleTile(this.eeInnerSize);
      return this.fill(this.eeInnerColour);
    }
  };

  ThemeBasic.prototype.drawSolns = function(solutions) {};

  ThemeBasic.prototype.drawMove = function(from, dir, path, callback) {
    var endDist, endStep, endTime, offs, pixy;
    offs = this.offs();
    pixy = [from[0] * this.tileSize, from[1] * this.tileSize];
    if (path == null) {
      path = [from];
    }
    endStep = path.length - 1;
    endTime = endStep * this.animOneStepMS;
    endDist = endStep * this.tileSize;
    return this.anim(callback, (function(_this) {
      return function(nowTime) {
        var nowDist, nowFrac, nowStep, posCurr, posNext, posPrev;
        if (nowTime > endTime) {
          nowTime = endTime;
        }
        nowFrac = (nowTime / endTime) || 0;
        nowStep = Math.floor(nowFrac * endStep);
        nowDist = nowFrac * endDist;
        posPrev = _this.maze.getNext(from, dir, nowStep - 1);
        posCurr = _this.maze.getNext(from, dir, nowStep);
        posNext = _this.maze.getNext(from, dir, nowStep + 1);
        _this.redraw(posPrev, posCurr, posNext);
        _this.c2d.save();
        _this.c2d.translate(offs[0], offs[1]);
        _this.c2d.translate(pixy[0], pixy[1]);
        switch (dir) {
          case "left":
            _this.c2d.translate(-nowDist, 0);
            break;
          case "right":
            _this.c2d.translate(nowDist, 0);
            break;
          case "up":
            _this.c2d.translate(0, -nowDist);
            break;
          case "down":
            _this.c2d.translate(0, nowDist);
        }
        _this.traceCircleTile(_this.avCircleSize);
        _this.fill(_this.avCircleColour);
        _this.traceCircleTile(_this.avInnerSize);
        _this.fill(_this.avInnerColour);
        _this.c2d.restore();
        return nowTime < endTime;
      };
    })(this));
  };

  return ThemeBasic;

})(ThemeTopdown);

registerTheme("basic", "Basic theme", new ThemeBasic);

var ThemePkmnGS,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ThemePkmnGS = (function(superClass) {
  extend(ThemePkmnGS, superClass);

  function ThemePkmnGS() {
    ThemePkmnGS.__super__.constructor.call(this, {
      tileSize: 16,
      marginSize: 32,
      onReady: resumeGame,
      onError: alert
    });
  }

  return ThemePkmnGS;

})(ThemeTopdown);

var examples, loadExample;

examples = {
  "gs0": ["The original Ice Path", "EA4PDQ8HQEBAQEBAQEBAQEBAQEBAAAAAAEAAAAAAAAAAQEAAAABAAAAAAAAAAABAQAAAAAAAAABAAAAAAEBAAEAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAABAAEBAAAAAAAAAQAAAAAAAQEAAAAAAAAAAAABAAABAQEAAAABAAAAAAAAAAEBAAABAAAAAAAAAAEAAQEAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAAEBAAAAAAAAAAAAAAAAAQEAAAAAAAEAAAEAAAAAgQEBAQEBAQCAgQEBAQCA="]
};

loadExample = function(egID) {
  var eg;
  if (eg = examples[egID]) {
    alert("Example: " + eg[0]);
  } else {
    return alert("Example[" + egID + "] is undefined");
  }
  return setMaze(decodeMaze(eg[1]));
};

var getURLParams;

getURLParams = function() {
  var decode, match, params, pl, query, search;
  pl = /\+/g;
  search = /([^&=]+)=?([^&]*)/g;
  decode = function(s) {
    return decodeURIComponent(s.replace(pl, " "));
  };
  query = window.location.search.substring(1);
  params = {};
  while (match = search.exec(query)) {
    params[decode(match[1])] = decode(match[2]);
  }
  return params;
};

$(function() {
  var args;
  $menu.show();
  args = getURLParams();
  if (args.maze != null) {
    setMaze(decodeMaze(args.maze));
  } else if (args.eg != null) {
    loadExample(args.eg);
  }
  if (!currMaze) {
    setMaze(new Maze(10, 10));
  }
  if (args.theme != null) {
    setTheme(args.theme);
  }
  if (!currTheme) {
    setTheme(args.theme = "basic");
  }
  if (args.mode === "play") {
    setMode("play");
  } else {
    setMode("edit");
  }
  loadThemesMenu(themes, args.theme);
  loadExamplesMenu(examples);
  $editMode.on("click", function() {
    return setMode("edit");
  });
  $playMode.on("click", function() {
    return setMode("play");
  });
  $playRestart.on("click", function() {
    return resetGame();
  });
  $newMaze.on("click", function() {
    var h, w;
    w = parseInt($newMazeWidth.val());
    h = parseInt($newMazeHeight.val());
    setMode("edit");
    setMaze(new Maze(w, h));
    return $newMazeModal.modal("hide");
  });
  $loadDecode.on("click", function() {
    $loadDecodeInput.val("");
    $loadDecodeModal.modal("show");
    return $loadDecodeInput.focus();
  });
  $loadDecodeSubmit.on("click", function() {
    setMaze(decodeMaze($loadDecodeInput.val()));
    return $loadDecodeModal.modal("hide");
  });
  $saveEncode.on("click", function() {
    $saveEncodeOutput.val(encodeMaze(currMaze));
    $saveEncodeModal.modal("show");
    return $saveEncodeOutput.focus();
  });
  $maze.on("click", handleClick);
  $maze.on("mousewheel", handleScroll);
  $(document).on("keydown", handleKeydown);
  $(window).on("resize", function() {
    refitUI();
    return resumeGame();
  });
  return $(window).trigger("resize");
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hemUuY29mZmVlIiwiZ2FtZS5jb2ZmZWUiLCJpby5jb2ZmZWUiLCJ1aS5jb2ZmZWUiLCJhbmltLmNvZmZlZSIsInRoZW1lLmNvZmZlZSIsInRoZW1lLXRvcGRvd24uY29mZmVlIiwidGhlbWUtYmFzaWMuY29mZmVlIiwidGhlbWUtcGttbmdzLmNvZmZlZSIsImV4YW1wbGVzLmNvZmZlZSIsIm1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLElBQUEsSUFBQTtFQUFBOztBQUFNO0VBRVEsY0FBQyxLQUFELEVBQVMsTUFBVDtJQUFDLElBQUMsQ0FBQSxRQUFEO0lBQVEsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7Ozs7O0lBQ3JCLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQyxFQUFEO0lBRVQsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFDLENBQUQsRUFBSSxDQUFKO0lBRVQsSUFBQyxDQUFBLElBQUQsR0FBUyxDQUFDLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBVixFQUFhLElBQUMsQ0FBQSxNQUFELEdBQVUsQ0FBdkI7RUFMRzs7aUJBT2IsR0FBQSxHQUFLLFNBQUMsRUFBRDtBQUNKLFFBQUE7SUFBQyxTQUFELEVBQUk7SUFDSixJQUFBLEdBQU8sQ0FBQyxJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBUCxJQUFhLEVBQWQsQ0FBa0IsQ0FBQSxDQUFBLENBQWxCLElBQXdCO0lBRS9CLE1BQVMsQ0FBQyxDQUFBLENBQUEsSUFBSyxDQUFMLElBQUssQ0FBTCxHQUFTLElBQUMsQ0FBQSxLQUFWLENBQUQsRUFBa0IsQ0FBQSxDQUFBLElBQUssQ0FBTCxJQUFLLENBQUwsR0FBUyxJQUFDLENBQUEsTUFBVixDQUFsQixDQUFULEVBQUMsVUFBRCxFQUFJO0lBRUosT0FBZSxDQUFDLENBQUEsS0FBSyxDQUFDLENBQVAsRUFBVSxDQUFBLEtBQUssSUFBQyxDQUFBLEtBQWhCLEVBQXVCLENBQUEsS0FBSyxDQUFDLENBQTdCLEVBQWdDLENBQUEsS0FB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Q0FBUyxDQUFDLEVBQVYsQ0FBYSxRQUFiLEVBQXVCLFNBQUE7SUFDdEIsT0FBQSxDQUFBO1dBQ0EsVUFBQSxDQUFBO0VBRnNCLENBQXZCO1NBS0EsQ0FBQSxDQUFFLE1BQUYsQ0FBUyxDQUFDLE9BQVYsQ0FBa0IsUUFBbEI7QUFqRUMsQ0FBRiIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIyBJY2VNYXplIChjKSAyMDEyLTIwMTMgYnkgTWF0dCBDdWRtb3JlXG5cbmNsYXNzIE1hemVcblxuXHRjb25zdHJ1Y3RvcjogKEB3aWR0aCwgQGhlaWdodCkgLT5cblx0XHRAY2VsbHMgPSBbW11dXG5cdFx0IyBkZWZhdWx0IGVudHJ5IGluIHRvcC1sZWZ0IGNvcm5lclxuXHRcdEBlbnRyeSA9IFswLCAwXVxuXHRcdCMgZGVmYXVsdCBleGl0IGluIGJvdHRvbS1yaWdodCBjb3JuZXJcblx0XHRAZXhpdCAgPSBbQHdpZHRoIC0gMSwgQGhlaWdodCAtIDFdXG5cblx0Z2V0OiAoYXQpID0+XG5cdFx0W3gsIHldID0gYXRcblx0XHR0aWxlID0gKEBjZWxsc1t4XSBvciBbXSlbeV0gb3Ige31cblx0XHQjIGNoZWNrIGZvciBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBjb2luY2lkZW5jZVxuXHRcdFtILCBWXSA9IFswIDw9IHggPCBAd2lkdGgsIDAgPD0geSA8IEBoZWlnaHRdXG5cdFx0IyBjaGVjayBmb3Igb3V0ZXIgZWRnZXNcblx0XHRbTCwgUiwgVCwgQl0gPSBbeCBpcyAtMSwgeCBpcyBAd2lkdGgsIHkgaXMgLTEsIHkgaXMgQGhlaWdodF1cblx0XHQjIGRlZmluZSBwb3NpdGlvbmFsIGF0dHJpYnV0ZXMgb24gdGlsZVxuXHRcdHJldHVybiAkLmV4dGVuZCB0aWxlLFxuXHRcdFx0aW5zaWRlOiBIIGFuZCBWXG5cdFx0XHRib3JkZXI6ICgoTCBvciBSKSBhbmQgVikgb3IgKChUIG9yIEIpIGFuZCBIKVxuXHRcdFx0Y29ybmVyOiAoTCBvciBSKSBhbmQgKFQgb3IgQilcblx0XHRcdGVkZ2VzOiAge2xlZnQ6IEwsIHJpZ2h0OiBSLCB0b3A6IFQsIGJvdHRvbTogQn1cblx0XHRcdGVudHJ5OiAgeCBpcyBAZW50cnlbMF0gYW5kIHkgaXMgQGVudHJ5WzFdXG5cdFx0XHRleGl0OiAgIHggaXMgQGV4aXRbMF0gYW5kIHkgaXMgQGV4aXRbMV1cblxuXHRpczogKGF0LCBhdHRycykgPT5cblx0XHR0aWxlID0gQGdldCBhdFxuXHRcdGZvciBhIG9mIGF0dHJzIHdoZW4gdGlsZVthXSBvciBhdHRyc1thXVxuXHRcdFx0cmV0dXJuIGZhbHNlIGlmIHRpbGVbYV0gaXNudCBhdHRyc1thXVxuXHRcdHJldHVybiB0cnVlXG5cblx0c2V0OiAoYXQsIGF0dHJzKSA9PlxuXHRcdHJldHVybiB1bmxlc3MgQGlzIGF0LCBpbnNpZGU6IHRydWVcblx0XHRbeCwgeV0gPSBhdFxuXHRcdCMgY3JlYXRlIHRoZSBjb2x1bW4gaW4gQGNlbGxzIGlmIG5vdCB5ZXQgZGVmaW5lZFxuXHRcdHRpbGUgPSAoQGNlbGxzW3hdID89IFtdKVt5XSBvciB7fVxuXHRcdHRpbGVbYV0gPSBhdHRyc1thXSBmb3IgYSBvZiBhdHRyc1xuXHRcdEBjZWxsc1t4XVt5XSA9IHRpbGVcblxuXHR0b2dnbGU6IChhdCwgYXR0cikgPT5cblx0XHRyZXR1cm4gdW5sZXNzIEBpcyBhdCwgaW5zaWRlOiB0cnVlXG5cdFx0dG9nID0ge31cblx0XHRyZXQgPSB0b2dbYXR0cl0gPSBub3QgQGdldChhdClbYXR0cl1cblx0XHRAc2V0IGF0LCB0b2dcblx0XHRyZXR1cm4gcmV0XG5cblx0c2V0RW50cnk6IChhdCkgPT5cblx0XHRAZW50cnkgPSBhdCBpZiBAaXMgYXQsIGluc2lkZTogdHJ1ZSwgZXhpdDogZmFsc2VcblxuXHRzZXRFeGl0OiAoYXQpID0+XG5cdFx0QGV4aXQgPSBhdCBpZiBAaXMgYXQsIGluc2lkZTogdHJ1ZSwgZW50cnk6IGZhbHNlXG5cblx0Y2xpY2s6IChhdCwgbWV0YWMpID0+XG5cdFx0cmV0dXJuIHVubGVzcyBAaXMgYXQsIGluc2lkZTogdHJ1ZVxuXHRcdHN3aXRjaCBtZXRhY1xuXHRcdFx0d2hlbiAxXG5cdFx0XHRcdHdhbGthYmxlID0gQHRvZ2dsZSBhdCwgXCJ3YWxrYWJsZVwiXG5cdFx0XHRcdGFjID0gaWYgd2Fsa2FibGUgdGhlbiBcIlNldFwiIGVsc2UgXCJVbnNldFwiXG5cdFx0XHRcdGFsZXJ0IFwiI3thY30gd2Fsa2FibGUgYXQgI3thdH1cIlxuXHRcdFx0d2hlbiAyXG5cdFx0XHRcdHNwZWNpYWwgPSAoKEBnZXQoYXQpLnNwZWNpYWwgfHwgMCkgKyAxKSAlIDMyXG5cdFx0XHRcdEBzZXQgYXQsIHNwZWNpYWw6IHNwZWNpYWxcblx0XHRcdFx0YWxlcnQgXCJTZXQgc3ByaXRlIGluZGV4IHRvICN7c3BlY2lhbH0gYXQgI3thdH1cIlxuXHRcdFx0d2hlbiAzXG5cdFx0XHRcdGxvY2tlZCA9IEB0b2dnbGUgYXQsIFwibG9ja2VkXCJcblx0XHRcdFx0YWMgPSBpZiBsb2NrZWQgdGhlbiBcIkxvY2tcIiBlbHNlIFwiVW5sb2NrXCJcblx0XHRcdFx0YWxlcnQgXCIje2FjfSB0aWxlIGF0ICN7YXR9XCJcblx0XHRcdGVsc2Vcblx0XHRcdFx0b2JzdGFjbGUgPSBAdG9nZ2xlIGF0LCBcIm9ic3RhY2xlXCJcblx0XHRcdFx0YWMgPSBpZiBvYnN0YWNsZSB0aGVuIFwiUHV0XCIgZWxzZSBcIkNsZWFyXCJcblx0XHRcdFx0YWxlcnQgXCIje2FjfSBvYnN0YWNsZSBhdCAje2F0fVwiXG5cdFx0cmV0dXJuIHRydWVcblxuXHRzY3JvbGw6IChhdCwgZGVsdGEpID0+XG5cdFx0ZGlyID0gaWYgZGVsdGEgPiAwIHRoZW4gMSBlbHNlIC0xXG5cdFx0c3BlY2lhbCA9ICgoQGdldChhdCkuc3BlY2lhbCB8fCAwKSArIGRpcikgJSAzMlxuXHRcdGlmIHNwZWNpYWwgPCAwIHRoZW4gc3BlY2lhbCArPSAzMlxuXHRcdEBzZXQgYXQsIHNwZWNpYWw6IHNwZWNpYWxcblxuXHRpc1Bhc3NhYmxlOiAoYXQpID0+XG5cdFx0dGlsZSA9IEBnZXQgYXRcblx0XHRyZXR1cm4gZmFsc2UgaWYgbm90IHRpbGUuaW5zaWRlXG5cdFx0IyBlbnRyeSBhbmQgZXhpdCBhcmUgYWx3YXlzIHBhc3NhYmxlXG5cdFx0cmV0dXJuIHRydWUgaWYgdGlsZS5lbnRyeSBvciB0aWxlLmV4aXRcblx0XHQjIG5vbi1vYnN0YWNsZSB0aWxlcyBhcmUgcGFzc2FibGVcblx0XHRyZXR1cm4gbm90IHRpbGUub2JzdGFjbGVcblxuXHRnZXRQYXRoOiAoZnJvbSwgZGlyKSA9PlxuXHRcdHBhdGggPSBbZnJvbV1cblx0XHR3aGlsZSB0cnVlXG5cdFx0XHRuZXh0ID0gQGdldE5leHQgZnJvbSwgZGlyXG5cdFx0XHRicmVhayBpZiBub3QgQGlzUGFzc2FibGUgbmV4dFxuXHRcdFx0cGF0aC5wdXNoIG5leHRcblx0XHRcdCMgdGFrZSBvbmx5IG9uZSBzdGVwIG9udG8gd2Fsa2FibGVcblx0XHRcdGJyZWFrIGlmIEBpcyBuZXh0LCB3YWxrYWJsZTogdHJ1ZVxuXHRcdFx0ZnJvbSA9IG5leHRcblx0XHRyZXR1cm4gcGF0aFxuXG5cdGdldE5leHQ6IChmcm9tLCBkaXIsIGRpc3QgPSAxKSAtPlxuXHRcdCMgZ2V0IG5leHQgcG9zaXRpb25cblx0XHRzd2l0Y2ggZGlyXG5cdFx0XHR3aGVuIFwibGVmdFwiICB0aGVuIFtmcm9tWzBdIC0gZGlzdCwgZnJvbVsxXV1cblx0XHRcdHdoZW4gXCJ1cFwiICAgIHRoZW4gW2Zyb21bMF0sIGZyb21bMV0gLSBkaXN0XVxuXHRcdFx0d2hlbiBcInJpZ2h0XCIgdGhlbiBbZnJvbVswXSArIGRpc3QsIGZyb21bMV1dXG5cdFx0XHR3aGVuIFwiZG93blwiICB0aGVuIFtmcm9tWzBdLCBmcm9tWzFdICsgZGlzdF1cblx0XHRcdGVsc2UgdGhyb3cgXCJVbnJlY29nbml6ZWQgZGlyZWN0aW9uICN7ZGlyfVwiXG5cblx0Z2V0UmVsYXRpdmVEaXJlY3Rpb246IChhLCBiKSAtPlxuXHRcdCMgYSByZWxhdGl2ZSB0byBiXG5cdFx0bGVmdDogIGFbMF0gPCBiWzBdXG5cdFx0cmlnaHQ6IGFbMF0gPiBiWzBdXG5cdFx0dXA6ICAgIGFbMV0gPCBiWzFdXG5cdFx0ZG93bjogIGFbMV0gPiBiWzFdXG4iLCIjIEljZU1hemUgKGMpIDIwMTItMjAxMyBieSBNYXR0IEN1ZG1vcmVcblxuY3Vyck1hemUgPSBudWxsXG5jdXJyTW9kZSA9IG51bGwgIyBcImVkaXRcIiBvciBcInBsYXlcIlxuY3VyclRoZW1lID0gbnVsbFxuY3VyclBQb3N0ID0gbnVsbCAjIHBsYXllciBwb3NpdGlvbiBbeCwgeV1cblxuc2V0TWF6ZSA9IChtYXplKSAtPlxuXHRjdXJyTWF6ZSA9IG1hemUgaWYgbWF6ZVxuXHRjdXJyVGhlbWU/LnByZXAgbWF6ZTogY3Vyck1hemVcblx0IyByZXNldCB3aXRoIG5ldyBtYXplXG5cdHJlZml0VUkoKVxuXHRyZXNldEdhbWUoKVxuXG5zZXRNb2RlID0gKG1vZGUpIC0+XG5cdHJldHVybiBpZiBjdXJyTW9kZSBpcyBtb2RlICNhbHJlYWR5XG5cdGlmIG1vZGUgaW4gW1wiZWRpdFwiLCBcInBsYXlcIl0gdGhlbiBhbGVydCBcIkJlZ2luICN7bW9kZX0gbW9kZVwiXG5cdGVsc2UgcmV0dXJuIGFsZXJ0IFwiTW9kZVsje21vZGV9XSBpcyB1bmRlZmluZWRcIlxuXG5cdGN1cnJNb2RlID0gbW9kZSBpZiBtb2RlXG5cdGN1cnJUaGVtZT8ucHJlcCBtb2RlOiBjdXJyTW9kZVxuXHRzZXRVSU1vZGUgY3Vyck1vZGVcblx0IyByZXNldCB3aXRoIG5ldyBtb2RlXG5cdHJlc2V0R2FtZSgpXG5cbnNldFRoZW1lID0gKHRoSUQpIC0+XG5cdGlmIHRoID0gdGhlbWVzW3RoSURdIHRoZW4gYWxlcnQgXCJUaGVtZTogI3t0aFswXX1cIlxuXHRlbHNlIHJldHVybiBhbGVydCBcIlRoZW1lWyN7dGhJRH1dIGlzIHVuZGVmaW5lZFwiXG5cblx0IyB1bmxvYWQgcHJldmlvdXNcblx0Y3VyclRoZW1lPy5zdG9wKClcblx0IyBsb2FkIHRoZW1lXG5cdGN1cnJUaGVtZSA9IHRoWzFdXG5cdCMgY29uZmlndXJlIHRoZW1lXG5cdGN1cnJUaGVtZS5wcmVwXG5cdFx0YzJkOiAkbWF6ZVswXS5nZXRDb250ZXh0KFwiMmRcIiksIGVsOiAkbWF6ZVswXVxuXHRcdG1hemU6IGN1cnJNYXplLCBtb2RlOiBjdXJyTW9kZVxuXHQjIHJlc3VtZSB3aXRoIG5ldyB0aGVtZVxuXHRyZWZpdFVJKClcblx0cmVzdW1lR2FtZSgpXG5cbnJlc2V0R2FtZSA9IC0+XG5cdGN1cnJUaGVtZT8uc3RvcCgpXG5cdGlmIGN1cnJNb2RlIGlzIFwicGxheVwiXG5cdFx0Y3VyclBQb3N0ID0gY3Vyck1hemUuZW50cnlcblx0XHRhbGVydCBcIkJlZ2luIGdhbWUgYXQgI3tjdXJyUFBvc3R9XCJcblx0cmVzdW1lR2FtZSgpXG5cbnJlc3VtZUdhbWUgPSAtPlxuXHRjdXJyVGhlbWU/LnN0b3AoKVxuXHRjdXJyVGhlbWU/LmNsZWFyQ2FudmFzKClcblx0Y3VyclRoZW1lPy5yZXN1bWUoKVxuXHRpZiBjdXJyTW9kZSBpcyBcInBsYXlcIlxuXHRcdGN1cnJUaGVtZT8uZHJhd01vdmUgY3VyclBQb3N0LCBcImRvd25cIlxuXG53aW5HYW1lID0gLT5cblx0aWYgbm90IGN1cnJUaGVtZS5mYW5mYXJlKClcblx0XHQjIHJldHVybiBmYWxzZSBmb3IgZGVmYXVsdFxuXHRcdCMgVE9ETyByYWlzZSBtb2RhbCBvciBzb21ldGhpbmdcblx0XHRhbGVydCBcIldJTiFcIlxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuIyB1c2VyIGludGVyYWN0aW9uc1xuXG5oYW5kbGVDbGljayA9IChldikgLT5cblx0IyBpbnRlcmNlcHQgYWxsIGNhbnZhcyBjbGlja3Ncblx0ZXYucHJldmVudERlZmF1bHQoKVxuXHQjIG9ubHkgcmVzcG9uZCB0byBjbGljayBldmVudHMgZHVyaW5nIGVkaXQgbW9kZVxuXHRyZXR1cm4gaWYgY3Vyck1vZGUgaXNudCBcImVkaXRcIlxuXHQjIGdldCBjbGljayBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB0aGUgY2FudmFzXG5cdG9mZnMgPSAkbWF6ZS5vZmZzZXQoKVxuXHRyZWxYID0gZXYucGFnZVggLSBvZmZzLmxlZnRcblx0cmVsWSA9IGV2LnBhZ2VZIC0gb2Zmcy50b3Bcblx0ZWRhdCA9IGN1cnJUaGVtZS5hdCByZWxYLCByZWxZXG5cdCMgY291bnQgYWN0aXZlIG1ldGEga2V5c1xuXHRtZXRhQ291bnQgPSBldi5hbHRLZXkgKyBldi5jdHJsS2V5ICsgZXYuc2hpZnRLZXlcblx0IyBwYXNzIG9ubHkgd2hhdCBpcyBuZWVkZWRcblx0Y3Vyck1hemUuY2xpY2sgZWRhdCwgbWV0YUNvdW50XG5cdGN1cnJUaGVtZS5yZWRyYXcgZWRhdFxuXG5oYW5kbGVTY3JvbGwgPSAoZXYsIGRlbHRhKSAtPlxuXHQjIGludGVyY2VwdCBhbGwgY2FudmFzIHNjcm9sbHNcblx0ZXYucHJldmVudERlZmF1bHQoKVxuXHQjIG9ubHkgcmVzcG9uZCB0byBzY3JvbGwgZXZlbnRzIGR1cmluZyBlZGl0IG1vZGVcblx0cmV0dXJuIGlmIGN1cnJNb2RlIGlzbnQgXCJlZGl0XCJcblx0IyBnZXQgbW91c2UgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdGhlIGNhbnZhc1xuXHRvZmZzID0gJG1hemUub2Zmc2V0KClcblx0cmVsWCA9IGV2LnBhZ2VYIC0gb2Zmcy5sZWZ0XG5cdHJlbFkgPSBldi5wYWdlWSAtIG9mZnMudG9wXG5cdGVkYXQgPSBjdXJyVGhlbWUuYXQgcmVsWCwgcmVsWVxuXHQjIHBhc3Mgb25seSB3aGF0IGlzIG5lZWRlZFxuXHRjdXJyTWF6ZS5zY3JvbGwgZWRhdCwgZGVsdGFcblx0Y3VyclRoZW1lLnJlZHJhdyBlZGF0XG5cbmhhbmRsZUtleWRvd24gPSAoZXYpIC0+XG5cdCMgb25seSByZXNwb25kIHRvIGtleWRvd24gZXZlbnRzIGR1cmluZyBwbGF5IG1vZGVcblx0cmV0dXJuIGlmIGN1cnJNb2RlIGlzbnQgXCJwbGF5XCJcblx0IyBibG9jayBmdXJ0aGVyIG1vdmVzIGR1cmluZyBhbmltYXRpb25cblx0cmV0dXJuIGlmIGN1cnJUaGVtZS5idXN5KClcblx0IyBnZXQgdGhlIGRpcmVjdGlvbiBvZiB3aGljaCBhcnJvdyBrZXkgd2FzIHByZXNzZWRcblx0ZGlya2V5cyA9IHszNzogXCJsZWZ0XCIsIDM4OiBcInVwXCIsIDM5OiBcInJpZ2h0XCIsIDQwOiBcImRvd25cIn1cblx0ZGlyZWN0aW9uID0gZGlya2V5c1tldi53aGljaF1cblx0IyBpZ25vcmUgdW5yZWNvZ25pemVkIGtleXNcblx0cmV0dXJuIGlmIG5vdCBkaXJlY3Rpb25cblx0IyBnZXQgdGhlIG1vdmVtZW50IHBhdGhcblx0cGF0aCA9IGN1cnJNYXplLmdldFBhdGggY3VyclBQb3N0LCBkaXJlY3Rpb25cblx0ZW5kcG9pbnQgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV1cblx0IyBpcyB0aGUgZW5kcG9pbnQgYSB3aW4/XG5cdHdpbm5lciA9IGN1cnJNYXplLmlzIGVuZHBvaW50LCBleGl0OiB0cnVlXG5cdCMgbG9nIHRoZSBtb3ZlXG5cdCNjb25zb2xlPy5sb2cgXCJNb3ZlICN7ZGlyZWN0aW9ufSB0byAje2VuZHBvaW50fVwiXG5cdCMgdGVsbCB0aGUgdGhlbWUgdG8gZHJhdyB0aGUgbW92ZW1lbnRcblx0Y3VyclRoZW1lLmRyYXdNb3ZlIGN1cnJQUG9zdCwgZGlyZWN0aW9uLCBwYXRoLCA9PlxuXHRcdGN1cnJQUG9zdCA9IGVuZHBvaW50XG5cdFx0d2luR2FtZSgpIGlmIHdpbm5lclxuIiwiIyBJY2VNYXplIChjKSAyMDEyLTIwMTMgYnkgTWF0dCBDdWRtb3JlXG5cbmVuY29kZU1hemUgPSAobWF6ZSkgLT5cblx0IyAxIGJ5dGUgcGVyIHZhbHVlXG5cdGRhdGEgPSBbXG5cdFx0bWF6ZS53aWR0aCwgbWF6ZS5oZWlnaHRcblx0XHRtYXplLmVudHJ5WzBdLCBtYXplLmVudHJ5WzFdXG5cdFx0bWF6ZS5leGl0WzBdLCBtYXplLmV4aXRbMV1cblx0XVxuXHQjIDEgYnl0ZSBwZXIgdGlsZVxuXHRmb3IgeCBpbiBbMCAuLiBtYXplLndpZHRoIC0gMV1cblx0XHRmb3IgeSBpbiBbMCAuLiBtYXplLmhlaWdodCAtIDFdXG5cdFx0XHR0aWxlID0gbWF6ZS5nZXQgW3gsIHldXG5cdFx0XHQjIDUgYml0cyBmb3Igc3BlY2lhbFxuXHRcdFx0cHJvcHMgPSAodGlsZS5zcGVjaWFsIG9yIDApICYgMzFcblx0XHRcdCMgMyBiaXRzIGZvciBwcm9wZXJ0aWVzXG5cdFx0XHRwcm9wcyB8PSAxIDw8IDcgaWYgdGlsZS5sb2NrZWRcblx0XHRcdHByb3BzIHw9IDEgPDwgNiBpZiB0aWxlLm9ic3RhY2xlXG5cdFx0XHRwcm9wcyB8PSAxIDw8IDUgaWYgdGlsZS53YWxrYWJsZVxuXHRcdFx0ZGF0YS5wdXNoIHByb3BzXG5cdCMgZW5jb2RlIGluIGJhc2U2NFxuXHRyZXR1cm4gd2luZG93LmJ0b2EgU3RyaW5nLmZyb21DaGFyQ29kZSBkYXRhLi4uXG5cbmRlY29kZU1hemUgPSAoZGF0YSkgLT5cblx0ZGF0YSA9IHdpbmRvdy5hdG9iIGRhdGFcblx0aSA9IDBcblx0IyAxIGJ5dGUgcGVyIHZhbHVlXG5cdG1hemUgPSBuZXcgTWF6ZShkYXRhLmNoYXJDb2RlQXQoaSsrKSwgZGF0YS5jaGFyQ29kZUF0KGkrKykpXG5cdG1hemUuZW50cnkgPSBbZGF0YS5jaGFyQ29kZUF0KGkrKyksIGRhdGEuY2hhckNvZGVBdChpKyspXVxuXHRtYXplLmV4aXQgPSBbZGF0YS5jaGFyQ29kZUF0KGkrKyksIGRhdGEuY2hhckNvZGVBdChpKyspXVxuXHQjIDEgYnl0ZSBwZXIgdGlsZVxuXHRmb3IgeCBpbiBbMCAuLiBtYXplLndpZHRoIC0gMV1cblx0XHRmb3IgeSBpbiBbMCAuLiBtYXplLmhlaWdodCAtIDFdXG5cdFx0XHRwcm9wcyA9IGRhdGEuY2hhckNvZGVBdChpKyspXG5cdFx0XHRtYXplLnNldCBbeCwgeV0sXG5cdFx0XHRcdCMgNSBiaXRzIGZvciBzcGVjaWFsXG5cdFx0XHRcdHNwZWNpYWw6IHByb3BzICYgMzFcblx0XHRcdFx0IyAzIGJpdHMgZm9yIHByb3BlcnRpZXNcblx0XHRcdFx0bG9ja2VkOiAocHJvcHMgJiAoMSA8PCA3KSkgPiAwXG5cdFx0XHRcdG9ic3RhY2xlOiAocHJvcHMgJiAoMSA8PCA2KSkgPiAwXG5cdFx0XHRcdHdhbGthYmxlOiAocHJvcHMgJiAoMSA8PCA1KSkgPiAwXG5cdHJldHVybiBtYXplXG4iLCIjIEljZU1hemUgKGMpIDIwMTItMjAxMyBieSBNYXR0IEN1ZG1vcmVcblxuIyBnbG9iYWwgalF1ZXJ5IGVsZW1lbnRzXG4kd2luICAgICAgICAgICAgICA9ICQod2luZG93KVxuJG1lbnUgICAgICAgICAgICAgPSAkKFwiI21lbnVcIilcbiR3cmFwICAgICAgICAgICAgID0gJChcIiN3cmFwXCIpXG4kbWF6ZSAgICAgICAgICAgICA9ICQoXCIjbWF6ZVwiKVxuJGluZm8gICAgICAgICAgICAgPSAkKFwiI2luZm9cIilcblxuJG5ld01hemUgICAgICAgICAgPSAkKFwiI25ld01hemVcIilcbiRuZXdNYXplV2lkdGggICAgID0gJChcIiNuZXdNYXplV2lkdGhcIilcbiRuZXdNYXplSGVpZ2h0ICAgID0gJChcIiNuZXdNYXplSGVpZ2h0XCIpXG4kbmV3TWF6ZU1vZGFsICAgICA9ICQoXCIjbmV3TWF6ZU1vZGFsXCIpXG5cbiMgTE9BRCBNRU5VXG4kZXhhbXBsZXNMaXN0ICAgICA9ICQoXCJ1bFwiLCBcIiNleGFtcGxlc01lbnVcIilcbiRsb2FkU2F2ZWRMaXN0ICAgID0gJChcInVsXCIsIFwiI2xvYWRTYXZlZE1lbnVcIilcbiRsb2FkRGVjb2RlICAgICAgID0gJChcIiNsb2FkRGVjb2RlXCIpXG4kbG9hZERlY29kZUlucHV0ICA9ICQoXCIjaW9UZXh0YXJlYVwiKVxuJGxvYWREZWNvZGVNb2RhbCAgPSAkKFwiI2lvTW9kYWxcIilcbiRsb2FkRGVjb2RlU3VibWl0ID0gJChcIiNpb0RlY29kZVwiKVxuXG4jIFNBVkUgTUVOVVxuJHNhdmVBcyAgICAgICAgICAgPSAkKFwiI3NhdmVBc1wiKVxuJHNhdmVPdmVyTGlzdCAgICAgPSAkKFwidWxcIiwgXCIjc2F2ZU92ZXJNZW51XCIpXG4kc2F2ZUVuY29kZSAgICAgICA9ICQoXCIjc2F2ZUVuY29kZVwiKVxuJHNhdmVFbmNvZGVPdXRwdXQgPSAkKFwiI2lvVGV4dGFyZWFcIilcbiRzYXZlRW5jb2RlTW9kYWwgID0gJChcIiNpb01vZGFsXCIpXG5cbiR0aGVtZXNMaXN0ICAgICAgID0gJChcInVsXCIsIFwiI3RoZW1lc01lbnVcIilcbiRwcmludCAgICAgICAgICAgID0gJChcIiNwcmludFwiKVxuXG4kZWRpdE1vZGUgICAgICAgICA9ICQoXCIjZWRpdE1vZGUsICN5YXlHb0VkaXRcIilcbiRlZGl0TWVudSAgICAgICAgID0gJChcIiNlZGl0TWVudVwiKVxuJGVkaXRTaG93U29sbnMgICAgPSAkKFwiI2VkaXRTaG93U29sbnNcIilcbiRlZGl0Q2xlYXJMb2NrcyAgID0gJChcIiNlZGl0Q2xlYXJMb2Nrc1wiKVxuJGVkaXRDbGVhclNwcml0ZXMgPSAkKFwiI2VkaXRDbGVhclNwZWNpYWxzXCIpXG5cbiRwbGF5TW9kZSAgICAgICAgID0gJChcIiNwbGF5TW9kZSwgI3lheUdvUGxheVwiKVxuJHBsYXlNZW51ICAgICAgICAgPSAkKFwiI3BsYXlNZW51XCIpXG4kcGxheVJlc3RhcnQgICAgICA9ICQoXCIjcGxheVJlc3RhcnRcIilcblxucmVmaXRVSSA9ICgpIC0+XG5cdCMgZ2V0IGF2YWlsYWJsZSBzcGFjZVxuXHR3aW5kb3dXaWR0aCA9ICR3aW4ud2lkdGgoKVxuXHR3aW5kb3dIZWlnaHQgPSAkd2luLmhlaWdodCgpXG5cdG1lbnVIZWlnaHQgPSAkbWVudS5vdXRlckhlaWdodCh0cnVlKVxuXHR3cmFwV2lkdGggPSB3aW5kb3dXaWR0aFxuXHR3cmFwSGVpZ2h0ID0gd2luZG93SGVpZ2h0IC0gbWVudUhlaWdodFxuXG5cdCMgcG9zaXRpb24gJHdyYXAgdW5kZXIgJG1lbnVcblx0JHdyYXAuY3NzKFwibWFyZ2luLXRvcFwiLCBtZW51SGVpZ2h0KVxuXHQjIHJlc2l6ZSAkd3JhcCB0byBmaWxsIHdpbmRvd1xuXHQkd3JhcC5oZWlnaHQod3JhcEhlaWdodCkud2lkdGgod3JhcFdpZHRoKVxuXG5cdHJldHVybiB1bmxlc3MgY3VyclRoZW1lXG5cdCMgYXNrIHRoZW1lIHRvIGNhbGN1bGF0ZSBuZXcgY2FudmFzIGRpbWVuc2lvbnNcblx0W21hemVXaWR0aCwgbWF6ZUhlaWdodF0gPSBjdXJyVGhlbWUucmVzaXplKFt3cmFwV2lkdGgsIHdyYXBIZWlnaHRdKVxuXHQjIHJlc2l6ZSAkbWF6ZSB0byBtZWV0IHRoZSB0aGVtZSdzIGV4cGVjdGF0aW9uc1xuXHQkbWF6ZS5hdHRyKFwid2lkdGhcIiwgbWF6ZVdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIG1hemVIZWlnaHQpXG5cblx0IyBwb3NpdGlvbiAkbWF6ZSBpbiBjZW50cmUgb2YgJHdyYXBcblx0b3ZlclcgPSBtYXplV2lkdGggPiB3cmFwV2lkdGhcblx0b3ZlckggPSBtYXplSGVpZ2h0ID4gd3JhcEhlaWdodFxuXHQkbWF6ZS5jc3MgcG9zaXRpb246IFwicmVsYXRpdmVcIixcblx0XHRsZWZ0OiAoaWYgb3ZlclcgdGhlbiAwIGVsc2UgTWF0aC5mbG9vcigod3JhcFdpZHRoIC0gbWF6ZVdpZHRoKSAvIDIpKSArIFwicHhcIixcblx0XHR0b3A6ICAoaWYgb3ZlckggdGhlbiAwIGVsc2UgTWF0aC5mbG9vcigod3JhcEhlaWdodCAtIG1hemVIZWlnaHQpIC8gMikpICsgXCJweFwiXG5cblx0IyBhZGQgc2Nyb2xsYmFycyB0byAkd3JhcCBpZiBuZWVkZWRcblx0JHdyYXAuY3NzKFwib3ZlcmZsb3cteFwiLCBpZiBvdmVyVyB0aGVuIFwic2Nyb2xsXCIgZWxzZSBcImhpZGRlblwiKVxuXHQkd3JhcC5jc3MoXCJvdmVyZmxvdy15XCIsIGlmIG92ZXJIIHRoZW4gXCJzY3JvbGxcIiBlbHNlIFwiaGlkZGVuXCIpXG5cdHJldHVyblxuXG5zZXRVSU1vZGUgPSAobW9kZSkgLT5cblx0c3dpdGNoIG1vZGVcblx0XHR3aGVuIFwiZWRpdFwiXG5cdFx0XHQkZWRpdE1vZGUuYWRkQ2xhc3MoXCJhY3RpdmVcIilcblx0XHRcdCRlZGl0TWVudS5zaG93KClcblx0XHRcdCRwbGF5TW9kZS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuXHRcdFx0JHBsYXlNZW51LmhpZGUoKVxuXHRcdHdoZW4gXCJwbGF5XCJcblx0XHRcdCRwbGF5TW9kZS5hZGRDbGFzcyhcImFjdGl2ZVwiKVxuXHRcdFx0JHBsYXlNZW51LnNob3coKVxuXHRcdFx0JGVkaXRNb2RlLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpXG5cdFx0XHQkZWRpdE1lbnUuaGlkZSgpXG5cdHJldHVyblxuXG5sb2FkVGhlbWVzTWVudSA9ICh0aGVtZXMsIGFjdGl2ZSkgLT5cblx0JHRoZW1lc0xpc3QuZW1wdHkoKVxuXHRyZWZvY3VzID0gKGkpLT4tPlxuXHRcdCR0aGVtZXNMaXN0LmZpbmQoXCJsaS5hY3RpdmVcIikucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcblx0XHQkdGhlbWVzTGlzdC5maW5kKFwibGlbdGhlbWVJRD0nI3tpfSddXCIpLmFkZENsYXNzKFwiYWN0aXZlXCIpXG5cdFx0c2V0VGhlbWUgaVxuXHRmb3IgaWQsIHRoIG9mIHRoZW1lc1xuXHRcdCQoXCI8bGk+PGEgdGFiaW5kZXg9Jy0xJyBocmVmPScjJz4je3RoWzBdfTwvYT48L2xpPlwiKVxuXHRcdC5hdHRyKFwidGhlbWVJRFwiLCBpZClcblx0XHQuYWRkQ2xhc3MoaWYgaWQgPT0gYWN0aXZlIHRoZW4gXCJhY3RpdmVcIiBlbHNlIFwiXCIpXG5cdFx0LmFwcGVuZFRvKCR0aGVtZXNMaXN0KVxuXHRcdC5vbihcImNsaWNrXCIsIHJlZm9jdXMoaWQpKSAjIGNsb3N1cmUgb24gaWRcblx0cmV0dXJuXG5cbmxvYWRFeGFtcGxlc01lbnUgPSAoZXhhbXBsZXMpIC0+XG5cdCRleGFtcGxlc0xpc3QuZW1wdHkoKVxuXHRoYW5kbGVyID0gKGkpLT4tPlxuXHRcdGxvYWRFeGFtcGxlIGlcblx0Zm9yIGlkLCBlZyBvZiBleGFtcGxlc1xuXHRcdCQoXCI8bGk+PGEgdGFiaW5kZXg9Jy0xJyBocmVmPScjJz4je2VnWzBdfTwvYT48L2xpPlwiKVxuXHRcdC5hdHRyKFwiZWdJRFwiLCBpZClcblx0XHQuYXBwZW5kVG8oJGV4YW1wbGVzTGlzdClcblx0XHQub24oXCJjbGlja1wiLCBoYW5kbGVyKGlkKSkgIyBjbG9zdXJlIG9uIGlkXG5cdHJldHVyblxuXG5sb2FkU3RvcmFnZU1lbnVzID0gKCkgLT5cblx0JGxvYWRTYXZlZExpc3QuZW1wdHkoKVxuXHQkc2F2ZU92ZXJMaXN0LmVtcHR5KClcblx0c29tZSA9IGZhbHNlXG5cdGZvciBpZCBvZiBtYXplc1xuXHRcdHNvbWUgPSB0cnVlXG5cdFx0JChcIjxsaT48YSB0YWJpbmRleD0nLTEnIGhyZWY9JyMnPiN7aWR9PC9hPjwvbGk+XCIpXG5cdFx0LmFwcGVuZFRvKCRsb2FkU2F2ZWRMaXN0KVxuXHRcdC5vbihcImNsaWNrXCIsICgoaSktPi0+IGxvYWRNYXplIGkpKGlkKSkgIyBjbG9zdXJlIG9uIGlkXG5cdFx0LmNsb25lKClcblx0XHQuYXBwZW5kVG8oJHNhdmVPdmVyTGlzdClcblx0XHQub24oXCJjbGlja1wiLCAoKGkpLT4tPiBzYXZlT3ZlcndyaXRlIGkpKGlkKSkgIyBjbG9zdXJlIG9uIGlkXG5cdGlmICFzb21lXG5cdFx0JChcIjxsaT48YSB0YWJpbmRleD0nLTEnIGhyZWY9JyMnPk5vbmU8L2E+PC9saT5cIilcblx0XHQuYWRkQ2xhc3MoXCJkaXNhYmxlZFwiKVxuXHRcdC5hcHBlbmRUbygkbG9hZFNhdmVkTGlzdClcblx0XHQuY2xvbmUoKVxuXHRcdC5hcHBlbmRUbygkc2F2ZU92ZXJMaXN0KVxuXHRyZXR1cm5cblxud2luZG93LmFsZXJ0ID0gKG1lc3NhZ2UsIHRpbWVvdXQgPSAyMDAwKSAtPlxuXHQjIHJhaXNlIG1lc3NhZ2Vcblx0JG0gPSAkKFwiPHAvPlwiKS50ZXh0KG1lc3NhZ2UpLmFwcGVuZFRvKCRpbmZvKTtcblx0ZmFkZVJlbW92ZSA9IC0+ICRtLmZhZGVPdXQgXCJzbG93XCIsICgpIC0+ICRtLnJlbW92ZSgpXG5cdCRtLm9uIFwiY2xpY2tcIiwgZmFkZVJlbW92ZVxuXHRzZXRUaW1lb3V0IGZhZGVSZW1vdmUsIHRpbWVvdXRcbiIsIiMgSWNlTWF6ZSAoYykgMjAxMi0yMDEzIGJ5IE1hdHQgQ3VkbW9yZVxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuIyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcG9seWZpbGwgYnkgRXJpayBNw7ZsbGVyXG4jIGZpeGVzIGZyb20gUGF1bCBJcmlzaCBhbmQgVGlubyBaaWpkZWxcbiMgaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vMTU3OTY3MVxuXG5kbyAtPlxuXHRmb3IgdiBpbiBbJ21zJywgJ21veicsICd3ZWJraXQnLCAnbyddXG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA/PVxuXHRcdFx0d2luZG93W1wiI3t2fVJlcXVlc3RBbmltYXRpb25GcmFtZVwiXVxuXHRcdHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA/PVxuXHRcdFx0d2luZG93W1wiI3t2fUNhbmNlbEFuaW1hdGlvbkZyYW1lXCJdIG9yXG5cdFx0XHR3aW5kb3dbXCIje3Z9Q2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lXCJdXG5cblx0bGFzdFRpbWUgPSAwXG5cdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPz0gKGNiLCBlbCkgLT5cblx0XHRjdXJyVGltZSA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpXG5cdFx0dGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKVxuXHRcdGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsXG5cdFx0d2luZG93LnNldFRpbWVvdXQoKC0+IGNiKGN1cnJUaW1lICsgdGltZVRvQ2FsbCkpLCB0aW1lVG9DYWxsKVxuXG5cdHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA/PSAoYW4pIC0+XG5cdFx0d2luZG93LmNsZWFyVGltZW91dChhbilcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiMgYW5pbWF0aW9uIGZhY3RvcnkgZnVuY3Rpb25cblxuc3RhcnRBbmltID0gKGZuLCBjYiwgZWwpIC0+XG5cdCMgc3RhcnRBbmltIHJldHVybnMgYSBjb250cm9sbGVyIGZvciB0aGUgYW5pbWF0aW9uLlxuXHQjIGNhbGwgY29udHJvbHMuc3RvcCgpIHRvIGVuZCB0aGUgYW5pbWF0aW9uIGFuZCBpbnZva2UgY2IuXG5cdCMgY2FsbCBjb250cm9scy5jYW5jZWwoKSB0byBlbmQgd2l0aG91dCBpbnZva2luZyBjYi5cblx0IyBmbiByZWNlaXZlcyB0aGUgZWxhcHNlZCB0aW1lIHNpbmNlIHN0YXJ0LCBhbmQgdGhlIGNvbnRyb2xsZXIuXG5cdCMgZm4gc2hvdWxkIHBlcmZvcm0gZHJhd2luZywgYW5kIHJldHVybiB0cnVlIGZvciBhbm90aGVyIGZyYW1lLlxuXHRpbml0VGltZSA9IG51bGxcblx0Y3VyckFuaW0gPSBudWxsXG5cdGRvbmUgPSBmYWxzZVxuXHRjb250cm9scyA9IHtcblx0XHRidXN5OiAtPiAhZG9uZVxuXHRcdHN0b3A6IC0+IGlmICFkb25lIHRoZW4gQGNhbmNlbCgpOyBpZiBjYiB0aGVuIGNiKClcblx0XHRjYW5jZWw6IC0+IGRvbmUgPSB0cnVlOyB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgY3VyckFuaW1cblx0fVxuXHRuZXh0ID0gLT4gY3VyckFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHN0ZXAsIGVsXG5cdHN0ZXAgPSAoY3VyclRpbWUpIC0+IGlmICFkb25lXG5cdFx0aW5pdFRpbWUgPz0gY3VyclRpbWVcblx0XHRpZiBmbihjdXJyVGltZSAtIGluaXRUaW1lLCBjb250cm9scykgdGhlbiBuZXh0KClcblx0XHRlbHNlIGNvbnRyb2xzLnN0b3AoKVxuXHRuZXh0KClcblx0cmV0dXJuIGNvbnRyb2xzXG4iLCIjIEljZU1hemUgKGMpIDIwMTItMjAxMyBieSBNYXR0IEN1ZG1vcmVcblxuIyBHTE9CQUxTXG50aGVtZXMgPSB7fVxucmVnaXN0ZXJUaGVtZSA9IChpZCwgdGl0bGUsIHRoZW1lKSAtPlxuXHR0aGVtZXNbaWRdID0gW3RpdGxlLCB0aGVtZV1cblxuY2xhc3MgVGhlbWVcblxuXHQjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuXHQjIE9WRVJSSURBQkxFU1xuXG5cdGltYWdlczoge1xuXHRcdCMgaW1nSUQ6IFwiZmlsZW5hbWVcIlxuXHRcdCMgKGZpbGVuYW1lcyB3aWxsIGJlIHJlcGxhY2VkIGJ5IGltYWdlIG9iamVjdHMsXG5cdFx0IyAgcHJlbG9hZGVkIGJ5IHRoZSBkZWZhdWx0IGNvbnN0cnVjdG9yLilcblx0fVxuXG5cdGZhbmZhcmU6ID0+XG5cdFx0IyBhY2tub3dsZWRnZSBhIHdpbiB3aXRoIHZpc3VhbCBmZWVkYmFjayxcblx0XHQjIG9yIHJldHVybiBmYWxzZSB0byByYWlzZSBhIHNpbXBsZSBtb2RhbCBtZXNzYWdlLlxuXHRcdHJldHVybiBmYWxzZVxuXG5cdCMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG5cdCMgUFVSRSBWSVJUVUFMIE1FVEhPRFNcblx0IyAodGhlbWVzIG11c3QgaW1wbGVtZW50IHRoZXNlIG1ldGhvZHMuKVxuXG5cdCNzaXplOiAoKSA9PlxuXHRcdCMgcmV0dXJuIHRoZSBtaW5pbXVtIGNhbnZhcyBbd2lkdGgsIGhlaWdodF0gbmVlZGVkIHRvIGRyYXcgdGhlIG1hemUuXG5cdCNhdDogKHgsIHkpID0+XG5cdFx0IyByZXR1cm4gdGhlIHRpbGUgcG9zaXRpb24gYXQgdGhlIGdpdmVuIFt4LCB5XSBwaXhlbCBjb29yZGluYXRlcy5cblx0I3JlZHJhdzogKHBvc2l0aW9ucy4uLikgPT5cblx0XHQjIHJlZHJhdyB0aGUgdGlsZXMgYXQgdGhlIGdpdmVuIHBvc2l0aW9ucyxcblx0XHQjIG9yIHJlZHJhdyB0aGUgZW50aXJlIG1hemUgaWYgbm8gcG9zaXRpb25zIGFyZSBnaXZlbi5cblx0I2RyYXdTb2xuczogKHNvbHV0aW9ucykgPT5cblx0XHQjIGRyYXcgdGhlIHNvbHV0aW9uIHBhdGhzXG5cdCNkcmF3TW92ZTogKHBvc2l0aW9uLCBkaXJlY3Rpb24sIHBhdGgsIGNhbGxiYWNrKSA9PlxuXHRcdCMgZHJhdyBhbiBhdmF0YXIgYXQgcG9zaXRpb24sIGZhY2luZyBkaXJlY3Rpb247XG5cdFx0IyBvciBhbmltYXRlIG1vdmluZyBpbiBkaXJlY3Rpb24gYWxvbmcgcGF0aC5cblx0XHQjIHVzZSBAYW5pbShpZCxmbk5leHRGcmFtZSkgdG8gcmVxdWVzdCBhbiBhbmltYXRpb24gZnJhbWUuXG5cdFx0IyBjYWxsIGNhbGxiYWNrIHdoZW4gYW5pbWF0aW9uIGNvbXBsZXRlcy5cblxuXHQjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuXHQjIFNUQVRFIFZBUklBQkxFU1xuXHQjICh0aGVtZXMgbWF5IHJlYWQgdGhlc2UsIGJ1dCBub3Qgd3JpdGUuKVxuXG5cdCNtYXplOiBzZXQgYnkgQHByZXA7IGN1cnJlbnQgbWF6ZVxuXHQjbW9kZTogc2V0IGJ5IEBwcmVwOyBjdXJyZW50IG1vZGUgZWl0aGVyIFwiZWRpdFwiIG9yIFwicGxheVwiXG5cdCNjMmQ6ICBzZXQgYnkgQHByZXA7IGN1cnJlbnQgY29udGV4dDJkIGZvciBkcmF3aW5nXG5cblx0Y2FudmFzU2l6ZTogWzAsIDBdICMgY3VycmVudCBzaXplIG9mIHRoZSBkcmF3aW5nIGNhbnZhc1xuXHR0aGVtZVJlYWR5OiBmYWxzZSAgIyB3aGV0aGVyIGFsbCBpbWFnZXMgaGF2ZSBiZWVuIGxvYWRlZFxuXHR0aGVtZU9uQWlyOiBmYWxzZSAgIyB3aGV0aGVyIHRoaXMgaXMgY3VycmVudGx5IHRoZSBhY3RpdmUgdGhlbWVcblx0Y3VyckFuaW06ICAgbnVsbCAgICMgY29udHJvbHMgZm9yIHRoZSBhY3RpdmUgYW5pbWF0aW9uXG5cblx0IyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcblx0IyBGSU5BTCBNRVRIT0RTXG5cblx0Y29uc3RydWN0b3I6IChjYlJlYWR5LCBjYkVycm9yKSAtPlxuXHRcdGFsbFJlYWR5ID0gKCk9PiBAdGhlbWVSZWFkeSA9IHRydWU7IGNiUmVhZHkoKSBpZiBjYlJlYWR5XG5cdFx0IyBjb3VudCBpbWFnZXNcblx0XHRyZW1haW5pbmcgPSAwXG5cdFx0cmVtYWluaW5nKysgZm9yIGkgb2YgQGltYWdlc1xuXHRcdCMgcmV0dXJuIGlmIG5vbmVcblx0XHRyZXR1cm4gYWxsUmVhZHkoKSBpZiByZW1haW5pbmcgaXMgMFxuXHRcdCMgY2FsbGJhY2sgY2xvc3VyZXNcblx0XHRpbWdMb2FkZWQgPSAoc3JjKT0+ICgpPT4gYWxsUmVhZHkoKSBpZiAtLXJlbWFpbmluZyBpcyAwXG5cdFx0aW1nRmFpbGVkID0gKHNyYyk9PiAoKT0+IGNiRXJyb3IoXCJGYWlsZWQgdG8gbG9hZCAje3NyY31cIikgaWYgY2JFcnJvclxuXHRcdCMgcHJlbG9hZCBpbWFnZXNcblx0XHRmb3IgaW1nSUQsIGltZ0ZpbGUgb2YgQGltYWdlc1xuXHRcdFx0aW1nID0gbmV3IEltYWdlKClcblx0XHRcdGltZy5vbmxvYWQgPSBpbWdMb2FkZWQoaW1nRmlsZSlcblx0XHRcdGltZy5vbmVycm9yID0gaW1nRmFpbGVkKGltZ0ZpbGUpXG5cdFx0XHRpbWcuc3JjID0gaW1nRmlsZVxuXHRcdFx0QGltYWdlc1tpbWdJRF0gPSBpbWdcblx0XHRyZXR1cm5cblxuXHRwcmVwOiAoYXR0cnMpID0+XG5cdFx0QHN0b3AoKVxuXHRcdEBjMmQgPSBhdHRycy5jMmQgaWYgYXR0cnMuYzJkP1xuXHRcdEBlbCA9IGF0dHJzLmVsIGlmIGF0dHJzLmVsXG5cdFx0QG1hemUgPSBhdHRycy5tYXplIGlmIGF0dHJzLm1hemU/XG5cdFx0QG1vZGUgPSBhdHRycy5tb2RlIGlmIGF0dHJzLm1vZGU/XG5cblx0YW5pbTogKGNiLCBmbikgPT5cblx0XHRAc3RvcCgpXG5cdFx0QHJlc3VtZSgpXG5cdFx0QGN1cnJBbmltID0gc3RhcnRBbmltIGZuLCBjYiwgQGVsXG5cblx0YnVzeTogPT5cblx0XHRAY3VyckFuaW0/LmJ1c3koKVxuXG5cdHN0b3A6ICgpID0+XG5cdFx0QHRoZW1lT25BaXIgPSBmYWxzZVxuXHRcdEBjdXJyQW5pbT8uY2FuY2VsKClcblxuXHRyZXN1bWU6ICgpID0+XG5cdFx0QHRoZW1lT25BaXIgPSB0cnVlXG5cdFx0QHJlZHJhdygpXG5cblx0cmVzaXplOiAobWluKSA9PlxuXHRcdFt3MSwgaDFdID0gbWluXG5cdFx0W3cyLCBoMl0gPSBAc2l6ZSgpXG5cdFx0bWF4ID0gKGEsIGIpIC0+IGlmIGEgPiBiIHRoZW4gYSBlbHNlIGJcblx0XHRAY2FudmFzU2l6ZSA9IFttYXgodzEsIHcyKSwgbWF4KGgxLCBoMildXG5cblx0IyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcblx0IyBHRU5FUkFMIERSQVdJTkcgVVRJTElUWSBNRVRIT0RTXG5cblx0Y2xlYXJDYW52YXM6ICgpID0+XG5cdFx0QGMyZC5jbGVhclJlY3QoMCwgMCwgQGNhbnZhc1NpemVbMF0sIEBjYW52YXNTaXplWzFdKVxuXG5cdGZpbGxDYW52YXM6IChzdHlsZSkgPT5cblx0XHRAYzJkLmZpbGxTdHlsZSA9IHN0eWxlXG5cdFx0QGMyZC5maWxsUmVjdCgwLCAwLCBAY2FudmFzU2l6ZVswXSwgQGNhbnZhc1NpemVbMV0pXG5cblx0ZmlsbDogKHN0eSkgPT5cblx0XHRAYzJkLmZpbGxTdHlsZSA9IHN0eVxuXHRcdEBjMmQuZmlsbCgpXG5cblx0c3Ryb2tlOiAod2lkLCBzdHkpID0+XG5cdFx0QGMyZC5saW5lV2lkdGggPSB3aWRcblx0XHRAYzJkLnN0cm9rZVN0eWxlID0gc3R5XG5cdFx0QGMyZC5zdHJva2UoKVxuXG5cdHRyYWNlUmVjdDogKHgsIHksIHcsIGgpID0+XG5cdFx0QGMyZC5iZWdpblBhdGgoKVxuXHRcdEBjMmQucmVjdCh4LCB5LCB3LCBoKVxuXHRcdEBjMmQuY2xvc2VQYXRoKClcblxuXHR0cmFjZVJvdW5kZWQ6ICh4LCB5LCB3LCBoLCByKSA9PlxuXHRcdCMgdGhhbmtzIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzMzNjgxMThcblx0XHRAYzJkLmJlZ2luUGF0aCgpXG5cdFx0QGMyZC5tb3ZlVG8oeCArIHIsIHkpXG5cdFx0QGMyZC5saW5lVG8oeCArIHcgLSByLCB5KVxuXHRcdEBjMmQucXVhZHJhdGljQ3VydmVUbyh4ICsgdywgeSwgeCArIHcsIHkgKyByKVxuXHRcdEBjMmQubGluZVRvKHggKyB3LCB5ICsgaCAtIHIpXG5cdFx0QGMyZC5xdWFkcmF0aWNDdXJ2ZVRvKHggKyB3LCB5ICsgaCwgeCArIHcgLSByLCB5ICsgaClcblx0XHRAYzJkLmxpbmVUbyh4ICsgciwgeSArIGgpXG5cdFx0QGMyZC5xdWFkcmF0aWNDdXJ2ZVRvKHgsIHkgKyBoLCB4LCB5ICsgaCAtIHIpXG5cdFx0QGMyZC5saW5lVG8oeCwgeSArIHIpXG5cdFx0QGMyZC5xdWFkcmF0aWNDdXJ2ZVRvKHgsIHksIHggKyByLCB5KVxuXHRcdEBjMmQuY2xvc2VQYXRoKClcblxuXHR0cmFjZUNpcmNsZTogKHgsIHksIHIpID0+XG5cdFx0QGMyZC5iZWdpblBhdGgoKVxuXHRcdEBjMmQuYXJjKHgsIHksIHIsIDAsIE1hdGguUEkgKiAyLCBmYWxzZSlcblx0XHRAYzJkLmNsb3NlUGF0aCgpXG4iLCIjIEljZU1hemUgKGMpIDIwMTItMjAxMyBieSBNYXR0IEN1ZG1vcmVcblxuY2xhc3MgVGhlbWVUb3Bkb3duIGV4dGVuZHMgVGhlbWVcblxuXHQjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuXHQjIE9WRVJSSURBQkxFU1xuXG5cdGltYWdlczoge1xuXHRcdCMgaW1nSUQ6IFwiZmlsZW5hbWVcIlxuXHR9XG5cblx0ZnJhbWVzOiB7XG5cdFx0IyBmcmFtZUlEOiBbaW1nSUQsIHgsIHksIHcsIGhdXG5cdH1cblxuXHRzcHJpdGVzOiB7XG5cdFx0IyBzcHJpdGVJRDogW2ZyYW1lUmF0ZSwgZnJhbWVzSURzXVxuXHRcdCMgd2hlcmUgZnJhbWVSYXRlIGlzOlxuXHRcdCMgICBlaXRoZXIgXCJtYW51YWxcIiBmb3IgbWFudWFsIHNlbGVjdCBkdXJpbmcgZWRpdCxcblx0XHQjICAgb3IgdGhlIG51bWJlciBvZiBmcmFtZXMgKGUuZy4gMSBvciAyKSBwZXIgcGxheWVyIHN0ZXA7XG5cdFx0IyBhbmQgZnJhbWVJRHMgaXMgYSBzZXF1ZW5jZSBvZiBvbmUgb3IgbW9yZTpcblx0XHQjICAgZWl0aGVyIGEgZnJhbWVJRCBmb3Igb25lIGxheWVyLFxuXHRcdCMgICBvciBbZnJhbWVJRC4uLl0gZm9yIGEgc3RhY2sgb2YgbGF5ZXJzLlxuXHR9XG5cblx0IyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcblx0IyBQVVJFIFZJUlRVQUwgTUVUSE9EU1xuXHQjICh0aGVtZXMgbXVzdCBpbXBsZW1lbnQgdGhlc2UgbWV0aG9kcy4pXG5cblx0I2RyYXdUaWxlOiAodGlsZSkgPT5cblx0XHQjIGRyYXcgYW4gaW50ZXJwcmV0YXRpb24gb2YgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG1hemUgdGlsZS5cblx0XHQjIHRoZSBiYXNlIHRyYW5zbGF0aW9uIGlzIHNldCB0byB0aGUgdGlsZSBvZmZzZXQuXG5cdFx0IyBpZiB0aWxlLmluc2lkZSB0aGVuIGl0J3MgYSBtYXplIHRpbGU7IGVsc2UgaXQncyBhIG1hdHRlIHRpbGUuXG5cdCNkcmF3U29sbnM6IChzb2x1dGlvbnMpID0+XG5cdFx0IyBzZWUgdGhlbWUuY29mZmVlXG5cdCNkcmF3TW92ZTogPT5cblx0XHQjIHNlZSB0aGVtZS5jb2ZmZWVcblxuXHQjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuXHQjIEZJTkFMIE1FVEhPRFNcblxuXHRjb25zdHJ1Y3RvcjogKHtAdGlsZVNpemUsIEBtYXJnaW5TaXplLCBvblJlYWR5LCBvbkVycm9yfSkgLT5cblx0XHRzdXBlcihvblJlYWR5LCBvbkVycm9yKVxuXG5cdHNpemU6ID0+XG5cdFx0IyByZXR1cm5zIHRoZSBtaW5pbXVtIGNhbnZhcyBzaXplIHJlcXVpcmVkIGZvciBkcmF3aW5nLlxuXHRcdG0gPSBAbWFyZ2luU2l6ZSAqIDJcblx0XHRtYXplVyA9IEBtYXplPy53aWR0aCBvciAwXG5cdFx0bWF6ZUggPSBAbWF6ZT8uaGVpZ2h0IG9yIDBcblx0XHRkcmF3VyA9IG1hemVXICogQHRpbGVTaXplXG5cdFx0ZHJhd0ggPSBtYXplSCAqIEB0aWxlU2l6ZVxuXHRcdHJldHVybiBbZHJhd1cgKyBtLCBkcmF3SCArIG1dXG5cblx0b2ZmczogPT5cblx0XHQjIHJldHVybnMgZHJhd2luZyBvZmZzZXRzIFt4LCB5XSBmb3IgY2VudHJpbmcgdGhlIG1hemUgb24gdGhlIGNhbnZhcy5cblx0XHRtaW5EcmF3aW5nU2l6ZSA9IEBzaXplKClcblx0XHR4b2ZmID0gTWF0aC5mbG9vcigoQGNhbnZhc1NpemVbMF0gLSBtaW5EcmF3aW5nU2l6ZVswXSkgLyAyKVxuXHRcdHlvZmYgPSBNYXRoLmZsb29yKChAY2FudmFzU2l6ZVsxXSAtIG1pbkRyYXdpbmdTaXplWzFdKSAvIDIpXG5cdFx0cmV0dXJuIFt4b2ZmICsgQG1hcmdpblNpemUsIHlvZmYgKyBAbWFyZ2luU2l6ZV1cblxuXHRhdDogKGNhbnZhc1gsIGNhbnZhc1kpID0+XG5cdFx0IyByZXR1cm5zIHRoZSB0aWxlIHBvc2l0aW9uIGF0IHRoZSBjYW52YXMgY29vcmRpbmF0ZXMuXG5cdFx0b2ZmcyA9IEBvZmZzKCkgIyB0aWxlICgwLDApIG9mZnNldHMgb24gZnVsbCBjYW52YXNcblx0XHR0aWxlWCA9IE1hdGguZmxvb3IoKGNhbnZhc1ggLSBvZmZzWzBdKSAvIEB0aWxlU2l6ZSlcblx0XHR0aWxlWSA9IE1hdGguZmxvb3IoKGNhbnZhc1kgLSBvZmZzWzFdKSAvIEB0aWxlU2l6ZSlcblx0XHRyZXR1cm4gW3RpbGVYLCB0aWxlWV1cblxuXHRkcmF3OiAocG9zaXRpb25zLi4uKSA9PiBAcmVkcmF3IHBvc2l0aW9ucy4uLlxuXHRyZWRyYXc6IChwb3NpdGlvbnMuLi4pID0+IGlmIEBtYXplPyBhbmQgQHRoZW1lT25BaXJcblx0XHRvZmZzID0gQG9mZnMoKVxuXHRcdHRyYW5zRHJhdyA9IChhdCkgPT5cblx0XHRcdEBjMmQuc2F2ZSgpXG5cdFx0XHRAYzJkLnRyYW5zbGF0ZSBvZmZzWzBdKyhhdFswXSpAdGlsZVNpemUpLCBvZmZzWzFdKyhhdFsxXSpAdGlsZVNpemUpXG5cdFx0XHRAY2xlYXJUaWxlKClcblx0XHRcdEBkcmF3VGlsZSBAbWF6ZS5nZXQgYXRcblx0XHRcdEBjMmQucmVzdG9yZSgpXG5cdFx0aWYgcG9zaXRpb25zLmxlbmd0aCA+IDBcblx0XHRcdCMgcmVkcmF3IGF0IG9ubHkgdGhlIGdpdmVuIHBvc2l0aW9uc1xuXHRcdFx0dHJhbnNEcmF3IGF0IGZvciBhdCBpbiBwb3NpdGlvbnNcblx0XHRlbHNlICMgcmVkcmF3IGV2ZXJ5dGhpbmcgKG1hdHRlIGFuZCBtYXplKVxuXHRcdFx0QGNsZWFyQ2FudmFzKClcblx0XHRcdG9yaWdpbiA9IFstTWF0aC5jZWlsKG9mZnNbMF0gLyBAdGlsZVNpemUpLCAtTWF0aC5jZWlsKG9mZnNbMV0gLyBAdGlsZVNpemUpXVxuXHRcdFx0Y2FudmFzID0gW01hdGguY2VpbChAY2FudmFzU2l6ZVswXSAvIEB0aWxlU2l6ZSksIE1hdGguY2VpbChAY2FudmFzU2l6ZVsxXSAvIEB0aWxlU2l6ZSldXG5cdFx0XHRbdywgaF0gPSBbY2FudmFzWzBdICsgb3JpZ2luWzBdLCBjYW52YXNbMV0gKyBvcmlnaW5bMV1dXG5cdFx0XHR0cmFuc0RyYXcgW3gsIHldIGZvciB4IGluIFtvcmlnaW5bMF0uLnddIGZvciB5IGluIFtvcmlnaW5bMV0uLmhdXG5cdFx0cmV0dXJuXG5cblx0IyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcblx0IyBUT1BET1dOIEJBU0lDIERSQVdJTkcgVVRJTElUWSBNRVRIT0RTXG5cblx0Y2xlYXJUaWxlOiA9PlxuXHRcdEBjMmQuY2xlYXJSZWN0IDAsIDAsIEB0aWxlU2l6ZSwgQHRpbGVTaXplXG5cblx0dHJhY2VTcXVhcmVUaWxlOiAocHNpemUpID0+XG5cdFx0d2ggPSBAdGlsZVNpemUgKiBwc2l6ZVxuXHRcdHh5ID0gKEB0aWxlU2l6ZSAtIHdoKSAvIDJcblx0XHRAdHJhY2VSZWN0IHh5LCB4eSwgd2gsIHdoXG5cblx0dHJhY2VSb3VuZGVkVGlsZTogKHBzaXplLCBwcmFkKSA9PlxuXHRcdHdoID0gQHRpbGVTaXplICogcHNpemVcblx0XHR4eSA9IChAdGlsZVNpemUgLSB3aCkgLyAyXG5cdFx0cmFkaXVzID0gd2ggKiBwcmFkXG5cdFx0QHRyYWNlUm91bmRlZCB4eSwgeHksIHdoLCB3aCwgcmFkaXVzXG5cblx0dHJhY2VDaXJjbGVUaWxlOiAocHNpemUpID0+XG5cdFx0d2ggPSBAdGlsZVNpemUgKiBwc2l6ZVxuXHRcdHh5ID0gQHRpbGVTaXplIC8gMlxuXHRcdEB0cmFjZUNpcmNsZSB4eSwgeHksIHdoIC8gMlxuXG5cdCMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG5cdCMgVE9QRE9XTiBTUFJJVEUgRFJBV0lORyBVVElMSVRZIE1FVEhPRFNcblxuXHRkcmF3U3ByaXRlOiAoc3ByaXRlSUQsIGZyYW1lID0gMCwgdGltZSA9IDApID0+XG5cdFx0IyBmcmFtZTogaW50ZWdlciBpbmRleCBpbnRvIHRoZSBzcHJpdGUncyBmcmFtZXNcblx0XHQjIHRpbWU6ICBmcmFjdGlvbiBvZiB0aW1lIHVuaXRzIHRvIGFkdmFuY2UgZnJhbWVcblx0XHRzcHJpdGUgPSBAc3ByaXRlc1tzcHJpdGVJRF1cblx0XHRmcmFtZXMgPSBzcHJpdGUubGVuZ3RoIC0gMVxuXHRcdCMgYWRqdXN0IHRoZSB0aW1lIGJ5IHRoZSBzcHJpdGUncyBmcmFtZSByYXRlXG5cdFx0dGltZSAqPSBpZiAkLmlzTnVtZXJpYyBzcHJpdGVbMF0gdGhlbiBzcHJpdGVbMF0gZWxzZSAxXG5cdFx0IyBhZHZhbmNlIHRoZSBmcmFtZSBieSB0aGUgbnVtYmVyIG9mIHdob2xlIHRpbWUgdW5pdHNcblx0XHRmcmFtZSArPSBNYXRoLmNlaWwgdGltZVxuXHRcdCMgdGhlIHNwcml0ZSBlbnRyeSBzcGVjaWZpZXMgb25lIG9yIG1vcmUgZnJhbWVJRCB2YWx1ZXNcblx0XHRmcklEcyA9IHNwcml0ZVsxICsgKGZyYW1lICUgKHNwcml0ZS5sZW5ndGggLSAxKSldXG5cdFx0aWYgJC5pc0FycmF5IGZySURzIHRoZW4gQGRyYXdGcmFtZSBmcklEIGZvciBmcklEIGluIGZySURzXG5cdFx0ZWxzZSBAZHJhd0ZyYW1lIGZySURzXG5cdFx0cmV0dXJuXG5cblx0ZHJhd0ZyYW1lOiAoZnJhbWVJRCkgPT5cblx0XHRmcmFtZSA9IEBmcmFtZXNbZnJhbWVJRF1cblx0XHRAYzJkLmRyYXdJbWFnZSBAaW1hZ2VzW2ZyYW1lWzBdXSxcblx0XHRcdGZyYW1lWzFdLCBmcmFtZVsyXSwgZnJhbWVbM10sIGZyYW1lWzRdLFxuXHRcdFx0MCwgMCwgQHRpbGVTaXplLCBAdGlsZVNpemVcbiIsIiMgSWNlTWF6ZSAoYykgMjAxMi0yMDEzIGJ5IE1hdHQgQ3VkbW9yZVxuIyBUaGVtZUJhc2ljIHRvIHNpbXBseSBkcmF3IHRoZSBtYXplIHdpdGggbm8gaW1hZ2UgZGVwZW5kZW5jaWVzXG5cbmNsYXNzIFRoZW1lQmFzaWMgZXh0ZW5kcyBUaGVtZVRvcGRvd25cblxuXHRjb25zdHJ1Y3RvcjogLT5cblx0XHRzdXBlciB0aWxlU2l6ZTogMzAsIG1hcmdpblNpemU6IDE1XG5cblx0YmdDb2xvdXI6ICAgICAgIFwid2hpdGVcIlxuXHRiZ0xvY2tDb2xvdXI6ICAgXCJ5ZWxsb3dcIlxuXG5cdGVkaXRUaWxlU2l6ZTogICAuOVxuXHRwbGF5VGlsZVNpemU6ICAgMVxuXHRpY2VDb2xvdXI6ICAgICAgXCJsaWdodGJsdWVcIlxuXHRkaXJ0Q29sb3VyOiAgICAgXCJ0YW5cIlxuXHRyb2NrVGlsZVNpemU6ICAgLjc1XG5cdHJvY2tSYWRpdXNTaXplOiAuMVxuXHRyb2NrQ29sb3VyOiAgICAgXCJncmF5XCJcblxuXHRlZUNpcmNsZVNpemU6ICAgLjY1XG5cdGVudHJ5Q29sb3VyOiAgICBcInJnYigwLDIwMCwxMDApXCJcblx0ZXhpdENvbG91cjogICAgIFwicmdiKDI1NSwxMDAsMClcIlxuXHRlZUlubmVyU2l6ZTogICAgLjRcblx0ZWVJbm5lckNvbG91cjogIFwid2hpdGVcIlxuXG5cdGF2Q2lyY2xlU2l6ZTogICAuNVxuXHRhdkNpcmNsZUNvbG91cjogXCJibGFja1wiXG5cdGF2SW5uZXJTaXplOiAgICAuNFxuXHRhdklubmVyQ29sb3VyOiAgXCJyZWRcIlxuXHRhbmltT25lU3RlcE1TOiAgNTBcblxuXHRkcmF3VGlsZTogKHRpbGUpID0+XG5cdFx0cmV0dXJuIGlmIG5vdCB0aWxlLmluc2lkZVxuXHRcdCMgY2xlYXJcblx0XHRAdHJhY2VTcXVhcmVUaWxlIDFcblx0XHRAZmlsbCBpZiB0aWxlLmxvY2tlZCB0aGVuIEBiZ0xvY2tDb2xvdXIgZWxzZSBAYmdDb2xvdXJcblxuXHRcdCMgZmxvb3IgLS0gc3F1YXJlXG5cdFx0QHRyYWNlU3F1YXJlVGlsZSBpZiBAbW9kZSBpcyBcImVkaXRcIiB0aGVuIEBlZGl0VGlsZVNpemUgZWxzZSBAcGxheVRpbGVTaXplXG5cdFx0QGZpbGwgaWYgdGlsZS53YWxrYWJsZSB0aGVuIEBkaXJ0Q29sb3VyIGVsc2UgQGljZUNvbG91clxuXG5cdFx0IyBvYmplY3RzIC0tIHJvdW5kZWQgc3F1YXJlXG5cdFx0aWYgdGlsZS5vYnN0YWNsZVxuXHRcdFx0QHRyYWNlUm91bmRlZFRpbGUgQHJvY2tUaWxlU2l6ZSwgQHJvY2tSYWRpdXNTaXplXG5cdFx0XHRAZmlsbCBAcm9ja0NvbG91clxuXG5cdFx0IyBlbnRyeS9leGl0IC0tIGNpcmNsZVxuXHRcdGlmIHRpbGUuZW50cnkgb3IgdGlsZS5leGl0XG5cdFx0XHRAdHJhY2VDaXJjbGVUaWxlIEBlZUNpcmNsZVNpemVcblx0XHRcdEBmaWxsIGlmIHRpbGUuZW50cnkgdGhlbiBAZW50cnlDb2xvdXIgZWxzZSBAZXhpdENvbG91clxuXHRcdFx0QHRyYWNlQ2lyY2xlVGlsZSBAZWVJbm5lclNpemVcblx0XHRcdEBmaWxsIEBlZUlubmVyQ29sb3VyXG5cblx0ZHJhd1NvbG5zOiAoc29sdXRpb25zKSA9PlxuXHRcdCMgVE9ET1xuXG5cdGRyYXdNb3ZlOiAoZnJvbSwgZGlyLCBwYXRoLCBjYWxsYmFjaykgPT5cblx0XHRvZmZzID0gQG9mZnMoKVxuXHRcdHBpeHkgPSBbZnJvbVswXSAqIEB0aWxlU2l6ZSwgZnJvbVsxXSAqIEB0aWxlU2l6ZV1cblx0XHRwYXRoID89IFtmcm9tXVxuXG5cdFx0ZW5kU3RlcCA9IHBhdGgubGVuZ3RoIC0gMVxuXHRcdGVuZFRpbWUgPSBlbmRTdGVwICogQGFuaW1PbmVTdGVwTVNcblx0XHRlbmREaXN0ID0gZW5kU3RlcCAqIEB0aWxlU2l6ZVxuXG5cdFx0QGFuaW0gY2FsbGJhY2ssIChub3dUaW1lKSA9PlxuXHRcdFx0aWYgbm93VGltZSA+IGVuZFRpbWUgdGhlbiBub3dUaW1lID0gZW5kVGltZVxuXHRcdFx0bm93RnJhYyA9IChub3dUaW1lIC8gZW5kVGltZSkgb3IgMFxuXHRcdFx0bm93U3RlcCA9IE1hdGguZmxvb3IgKG5vd0ZyYWMgKiBlbmRTdGVwKVxuXHRcdFx0bm93RGlzdCA9IG5vd0ZyYWMgKiBlbmREaXN0XG5cblx0XHRcdCMgcmVkcmF3IGFkamFjZW50IHRpbGVzXG5cdFx0XHRwb3NQcmV2ID0gQG1hemUuZ2V0TmV4dCBmcm9tLCBkaXIsIG5vd1N0ZXAgLSAxXG5cdFx0XHRwb3NDdXJyID0gQG1hemUuZ2V0TmV4dCBmcm9tLCBkaXIsIG5vd1N0ZXBcblx0XHRcdHBvc05leHQgPSBAbWF6ZS5nZXROZXh0IGZyb20sIGRpciwgbm93U3RlcCArIDFcblx0XHRcdEByZWRyYXcgcG9zUHJldiwgcG9zQ3VyciwgcG9zTmV4dFxuXG5cdFx0XHQjIGRyYXcgYXZhdGFyXG5cdFx0XHRAYzJkLnNhdmUoKVxuXHRcdFx0QGMyZC50cmFuc2xhdGUgb2Zmc1swXSwgb2Zmc1sxXVxuXHRcdFx0QGMyZC50cmFuc2xhdGUgcGl4eVswXSwgcGl4eVsxXVxuXHRcdFx0c3dpdGNoIGRpclxuXHRcdFx0XHR3aGVuIFwibGVmdFwiIHRoZW4gIEBjMmQudHJhbnNsYXRlIC1ub3dEaXN0LCAwXG5cdFx0XHRcdHdoZW4gXCJyaWdodFwiIHRoZW4gQGMyZC50cmFuc2xhdGUgbm93RGlzdCwgMFxuXHRcdFx0XHR3aGVuIFwidXBcIiB0aGVuICAgIEBjMmQudHJhbnNsYXRlIDAsIC1ub3dEaXN0XG5cdFx0XHRcdHdoZW4gXCJkb3duXCIgdGhlbiAgQGMyZC50cmFuc2xhdGUgMCwgbm93RGlzdFxuXHRcdFx0QHRyYWNlQ2lyY2xlVGlsZSBAYXZDaXJjbGVTaXplXG5cdFx0XHRAZmlsbCBAYXZDaXJjbGVDb2xvdXJcblx0XHRcdEB0cmFjZUNpcmNsZVRpbGUgQGF2SW5uZXJTaXplXG5cdFx0XHRAZmlsbCBAYXZJbm5lckNvbG91clxuXHRcdFx0QGMyZC5yZXN0b3JlKClcblxuXHRcdFx0IyByZXF1ZXN0IGFub3RoZXIgZnJhbWU/XG5cdFx0XHRyZXR1cm4gbm93VGltZSA8IGVuZFRpbWVcblxuIyBpbmNsdWRlIHRoaXMgdGhlbWUgaW4gcHJvZHVjdGlvblxucmVnaXN0ZXJUaGVtZSBcImJhc2ljXCIsIFwiQmFzaWMgdGhlbWVcIiwgbmV3IFRoZW1lQmFzaWNcbiIsIiMgSWNlTWF6ZSAoYykgMjAxMi0yMDEzIGJ5IE1hdHQgQ3VkbW9yZVxuIyBUaGVtZVBrbW5HUyB0byBkcmF3IHRoZSBtYXplIHVzaW5nIHRoZSBvcmlnaW5hbCBQb2vDqW1vbiBHb2xkL1NpbHZlciB0aWxlc2V0XG5cbmNsYXNzIFRoZW1lUGttbkdTIGV4dGVuZHMgVGhlbWVUb3Bkb3duXG5cblx0Y29uc3RydWN0b3I6IC0+XG5cdFx0c3VwZXIgdGlsZVNpemU6IDE2LCBtYXJnaW5TaXplOiAzMiwgb25SZWFkeTogcmVzdW1lR2FtZSwgb25FcnJvcjogYWxlcnRcblxuI3JlZ2lzdGVyVGhlbWUgXCJnc1wiLCBcIlBva8OpbW9uIEdvbGQvU2lsdmVyIHRoZW1lXCIsIG5ldyBUaGVtZVBrbW5HU1xuIiwiIyBJY2VNYXplIChjKSAyMDEyLTIwMTMgYnkgTWF0dCBDdWRtb3JlXG5cbmV4YW1wbGVzID0ge1xuXHRcImdzMFwiIDogW1xuXHRcdFwiVGhlIG9yaWdpbmFsIEljZSBQYXRoXCJcblx0XHRcIkVBNFBEUThIUUVCQVFFQkFRRUJBUUVCQVFFQkFBQUFBQUVBQUFBQUFBQUFBUUVBQUFBQkFBQUFBQUFBQUFBQkFRQUFBQUFBQUFBQkFBQUFBQUVCQUFFQUFBQUFBQUFBQUFBQUFRRUFBQUFBQUFBQUFBQUFBQUFCQVFBQUFBQUFBQUFBQUFBQkFBRUJBQUFBQUFBQUFRQUFBQUFBQVFFQUFBQUFBQUFBQUFBQkFBQUJBUUVBQUFBQkFBQUFBQUFBQUFFQkFBQUJBQUFBQUFBQUFBRUFBUUVBQUFBQUFBQUFBQUFBQUFBQkFRQUFBQUFBQUFBQUFBQUFBQUVCQUFBQUFBQUFBQUFBQUFBQUFRRUFBQUFBQUFFQUFBRUFBQUFBZ1FFQkFRRUJBUUNBZ1FFQkFRQ0E9XCJcblx0XVxufVxuXG5sb2FkRXhhbXBsZSA9IChlZ0lEKSAtPlxuXHRpZiBlZyA9IGV4YW1wbGVzW2VnSURdIHRoZW4gYWxlcnQgXCJFeGFtcGxlOiAje2VnWzBdfVwiXG5cdGVsc2UgcmV0dXJuIGFsZXJ0IFwiRXhhbXBsZVsje2VnSUR9XSBpcyB1bmRlZmluZWRcIlxuXHRzZXRNYXplIGRlY29kZU1hemUgZWdbMV1cbiIsIiMgSWNlTWF6ZSAoYykgMjAxMi0yMDEzIGJ5IE1hdHQgQ3VkbW9yZVxuXG5nZXRVUkxQYXJhbXMgPSAtPlxuXHQjIHRoYW5rcyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yODgwOTI5LzE1OTcyNzRcblx0cGwgICAgID0gL1xcKy9nICMgZm9yIHJlcGxhY2luZyBhZGRpdGlvbiBzeW1ib2wgd2l0aCBhIHNwYWNlXG5cdHNlYXJjaCA9IC8oW14mPV0rKT0/KFteJl0qKS9nXG5cdGRlY29kZSA9IChzKS0+IGRlY29kZVVSSUNvbXBvbmVudChzLnJlcGxhY2UocGwsIFwiIFwiKSlcblx0cXVlcnkgID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5zdWJzdHJpbmcoMSlcblx0cGFyYW1zID0ge31cblx0d2hpbGUgbWF0Y2ggPSBzZWFyY2guZXhlYyBxdWVyeVxuXHRcdHBhcmFtc1tkZWNvZGUgbWF0Y2hbMV1dID0gZGVjb2RlIG1hdGNoWzJdXG5cdHJldHVybiBwYXJhbXNcblxuJCAtPlxuXHQjIEphdmFTY3JpcHQgZW5hYmxlZDsgc2hvdyB0aGUgbWVudVxuXHQkbWVudS5zaG93KClcblxuXHRhcmdzID0gZ2V0VVJMUGFyYW1zKClcblxuXHQjIGxvYWQgc3BlY2lmaWVkIG1hemVcblx0aWYgYXJncy5tYXplPyB0aGVuIHNldE1hemUgZGVjb2RlTWF6ZSBhcmdzLm1hemVcblx0ZWxzZSBpZiBhcmdzLmVnPyB0aGVuIGxvYWRFeGFtcGxlIGFyZ3MuZWdcblx0IyBmYWxsYmFjayB0byBuZXcgbWF6ZVxuXHRpZiBub3QgY3Vyck1hemUgdGhlbiBzZXRNYXplIG5ldyBNYXplKDEwLCAxMClcblxuXHQjIGxvYWQgc3BlY2lmaWVkIHRoZW1lXG5cdGlmIGFyZ3MudGhlbWU/IHRoZW4gc2V0VGhlbWUgYXJncy50aGVtZVxuXHQjIGZhbGxiYWNrIHRvIGJhc2ljIHRoZW1lXG5cdGlmIG5vdCBjdXJyVGhlbWUgdGhlbiBzZXRUaGVtZSBhcmdzLnRoZW1lID0gXCJiYXNpY1wiXG5cblx0IyBzZXQgc3BlY2lmaWVkIG1vZGVcblx0aWYgYXJncy5tb2RlIGlzIFwicGxheVwiIHRoZW4gc2V0TW9kZSBcInBsYXlcIlxuXHQjIGRlZmF1bHQgdG8gZWRpdCBtb2RlXG5cdGVsc2Ugc2V0TW9kZSBcImVkaXRcIlxuXG5cdCMgbG9hZCBkeW5hbWljIG1lbnVzXG5cdGxvYWRUaGVtZXNNZW51IHRoZW1lcywgYXJncy50aGVtZVxuXHRsb2FkRXhhbXBsZXNNZW51IGV4YW1wbGVzXG5cdCNsb2FkU3RvcmFnZSgpXG5cdCNsb2FkU3RvcmFnZU1lbnVzKClcblxuXHQjIGFkZCBzdGF0aWMgbWVudSBoYW5kbGVyc1xuXHQkZWRpdE1vZGUub24gXCJjbGlja1wiLCAoKS0+IHNldE1vZGUgXCJlZGl0XCJcblx0JHBsYXlNb2RlLm9uIFwiY2xpY2tcIiwgKCktPiBzZXRNb2RlIFwicGxheVwiXG5cdCRwbGF5UmVzdGFydC5vbiBcImNsaWNrXCIsICgpLT4gcmVzZXRHYW1lKClcblxuXHQkbmV3TWF6ZS5vbiBcImNsaWNrXCIsICgpLT5cblx0XHR3ID0gcGFyc2VJbnQoJG5ld01hemVXaWR0aC52YWwoKSlcblx0XHRoID0gcGFyc2VJbnQoJG5ld01hemVIZWlnaHQudmFsKCkpXG5cdFx0c2V0TW9kZSBcImVkaXRcIlxuXHRcdHNldE1hemUgbmV3IE1hemUodywgaClcblx0XHQkbmV3TWF6ZU1vZGFsLm1vZGFsIFwiaGlkZVwiXG5cblx0JGxvYWREZWNvZGUub24gXCJjbGlja1wiLCAoKS0+XG5cdFx0JGxvYWREZWNvZGVJbnB1dC52YWwgXCJcIlxuXHRcdCRsb2FkRGVjb2RlTW9kYWwubW9kYWwgXCJzaG93XCJcblx0XHQkbG9hZERlY29kZUlucHV0LmZvY3VzKClcblxuXHQkbG9hZERlY29kZVN1Ym1pdC5vbiBcImNsaWNrXCIsICgpLT5cblx0XHRzZXRNYXplIGRlY29kZU1hemUgJGxvYWREZWNvZGVJbnB1dC52YWwoKVxuXHRcdCRsb2FkRGVjb2RlTW9kYWwubW9kYWwgXCJoaWRlXCJcblxuXHQkc2F2ZUVuY29kZS5vbiBcImNsaWNrXCIsICgpLT5cblx0XHQkc2F2ZUVuY29kZU91dHB1dC52YWwgZW5jb2RlTWF6ZSBjdXJyTWF6ZVxuXHRcdCRzYXZlRW5jb2RlTW9kYWwubW9kYWwgXCJzaG93XCJcblx0XHQkc2F2ZUVuY29kZU91dHB1dC5mb2N1cygpXG5cblx0IyBhZGQgbWF6ZSBoYW5kbGVyc1xuXHQkbWF6ZS5vbiBcImNsaWNrXCIsIGhhbmRsZUNsaWNrXG5cdCRtYXplLm9uIFwibW91c2V3aGVlbFwiLCBoYW5kbGVTY3JvbGxcblx0JChkb2N1bWVudCkub24gXCJrZXlkb3duXCIsIGhhbmRsZUtleWRvd25cblxuXHQjIHJlZml0VUkoKSBoYW5kbGVzIGxheW91dFxuXHQkKHdpbmRvdykub24gXCJyZXNpemVcIiwgKCktPlxuXHRcdHJlZml0VUkoKVxuXHRcdHJlc3VtZUdhbWUoKVxuXG5cdCMgZW5zdXJlIGluaXRpYWwgbGF5b3V0XG5cdCQod2luZG93KS50cmlnZ2VyIFwicmVzaXplXCJcbiJdfQ==
