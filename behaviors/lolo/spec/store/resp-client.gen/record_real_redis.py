"""Records two overlapping keys against a real Redis 7 (docker, port 16379) into real-redis7.json: the exact bytes the atom pipelines for
RESP_RUN a (GET x) and RESP_RUN b (INCRBY n 7) are written in one send, and the server's replies are read back as the socket delivers them."""
import base64, json, os, socket, subprocess, time
HERE = os.path.dirname(os.path.abspath(__file__))
b64 = lambda b: base64.b64encode(b).decode()
cmd = lambda *a: ("*%d\r\n" % len(a) + "".join("$%d\r\n%s\r\n" % (len(x.encode()), x) for x in a)).encode()
subprocess.run(["docker", "exec", "l4-redis7", "redis-cli", "FLUSHALL"], check=True, capture_output=True)
subprocess.run(["docker", "exec", "l4-redis7", "redis-cli", "SET", "x", "v1"], check=True, capture_output=True)
a = cmd("GET", "x")
b = cmd("INCRBY", "n", "7")
s = socket.create_connection(("127.0.0.1", 16379))
s.sendall(a + b)
data = b""
reads = []
s.settimeout(2)
while len(data) < len(b"$2\r\nv1\r\n:7\r\n"):
    chunk = s.recv(65536)
    reads.append(chunk)
    data += chunk
s.close()
json.dump({"server": "redis:7", "send": b64(a + b), "reads": [b64(r) for r in reads]}, open(os.path.join(HERE, "real-redis7.json"), "w"), indent=1)
print(reads)
