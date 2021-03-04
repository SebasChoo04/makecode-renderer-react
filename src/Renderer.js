import * as React from "react";
// update url with target editor
export let makecodeUrl = "https://makecode.microbit.org/";
// force language if needed
export let lang = undefined;
const RENDER_DEBOUNCE_TIMEOUT = 1000;
let rendererReady = false;
let rendererError = "";
let nextRequest = 0;
const pendingRequests = {};
function renderBlocks(req, cb) {
  req.id = nextRequest++ + "";
  pendingRequests[req.id] = { req, cb };
  if (rendererReady) sendRequest(req);
}
function sendRequest(req) {
  const f = startRenderer();
  if (f) f.contentWindow.postMessage(req, makecodeUrl);
}
// listen for messages
function handleMessage(ev) {
  let msg = ev.data;
  if (msg.source !== "makecode") return;
  switch (msg.type) {
    case "renderready":
      rendererReady = true;
      rendererError = undefined;
      Object.keys(pendingRequests).forEach((k) =>
        sendRequest(pendingRequests[k].req)
      );
      break;
    case "renderblocks":
      const id = msg.id; // this is the id you sent
      const r = pendingRequests[id];
      if (!r) return;
      delete pendingRequests[id];
      r.cb(msg);
      break;
    default:
      break;
  }
}
function startRenderer() {
  if (!makecodeUrl) return undefined;
  let f = document.getElementById("makecoderenderer");
  if (f) return f;
  window.addEventListener("message", handleMessage, false);
  f = document.createElement("iframe");
  f.id = "makecoderenderer";
  f.style.position = "absolute";
  f.style.left = "0";
  f.style.bottom = "0";
  f.style.width = "100px";
  f.style.height = "100px";
  f.src = `${makecodeUrl}--docs?render=1${lang ? `&lang=${lang}` : ""}`;
  document.body.appendChild(f);
  // check if connection failed
  setTimeout(function () {
    if (!rendererReady)
      rendererError =
        "Oops, can't connect to MakeCode. Please check your internet connection.";
  }, 30000);
  return f;
}
export class Snippet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.renderProps = this.renderProps.bind(this);
    this.debouncedRenderProps = Snippet.debounce(
      this.renderProps,
      RENDER_DEBOUNCE_TIMEOUT
    );
  }
  static debounce(func, wait) {
    let timeout;
    return function () {
      let context = this;
      let args = arguments;
      let later = function () {
        timeout = null;
        func.apply(context, args);
      };
      let callNow = !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }
  componentDidMount() {
    startRenderer();
    this.debouncedRenderProps();
  }
  componentWillReceiveProps(nextProps) {
    if (
      this.props.code !== nextProps.code ||
      this.props.packageId !== nextProps.packageId ||
      this.props.package !== nextProps.package ||
      this.props.snippetMode !== nextProps.snippetMode
    ) {
      this.debouncedRenderProps();
    }
  }
  renderProps() {
    // clear state and render again
    const { code, packageId, package: _package, snippetMode } = this.props;
    this.setState({
      uri: undefined,
      width: undefined,
      height: undefined,
      error: undefined,
      rendering: false,
    });
    if (code) {
      this.setState({ rendering: true });
      renderBlocks(
        {
          type: "renderblocks",
          id: "",
          code,
          options: {
            packageId,
            package: _package,
            snippetMode,
          },
        },
        (resp) => {
          this.setState({
            uri: resp.uri,
            width: resp.width,
            height: resp.height,
            error: resp.error,
            rendering: false,
          });
        }
      );
    }
  }
  render() {
    const { code } = this.props;
    const { uri, width, height, rendering, error } = this.state;
    // waiting for the iframe to start?
    const loading = !rendererReady;
    // is there any error?
    const err = error || rendererError;
    // display code if blocks rendering failed
    const precode = loading || !rendererReady || err || !uri ? code : undefined;
    return (
      <div>
        {loading || rendering ? <div className="ui active inverted dimmer"> <div className="ui loader"> </div> </div> : undefined}
        {precode ? <pre> <code> {precode} </code> </pre> : undefined}
        {err ? <div className="ui message info"> {err} </div> : undefined}
        {uri ? <img className="ui image" alt={code} src={uri} width={width} height={height}/> : undefined}
      </div>
    );
  }
}
