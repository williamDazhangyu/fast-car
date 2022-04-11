import * as http from "http";
import * as https from "https";
import * as http2 from "http2";
import * as net from "net";
import * as tls from "tls";

export type ServerType = net.Server | tls.Server | http.Server | https.Server | http2.Http2SecureServer | http2.Http2Server;
export type HttpServerType = http.Server | https.Server | http2.Http2SecureServer | http2.Http2Server;
