import { DomainSocket } from "./domain_socket";
import { GRPCStream } from "./grpc";
import { HttpStream } from "./http";
import { KCPStream } from "./kcp";
import { QuicStream } from "./quic";
import { TCPStream } from "./tcp";
import { WSStream } from "./ws";

export type Streams = TCPStream | KCPStream | WSStream | HttpStream | QuicStream | GRPCStream | DomainSocket