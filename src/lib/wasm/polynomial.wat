(module
  (func $poly (export "poly") (param $x f64) (result f64)
    local.get $x
    local.get $x
    f64.mul
    local.get $x
    f64.mul
    f64.const 2
    local.get $x
    f64.mul
    f64.sub
    f64.const 1
    f64.add)

  (func $dpoly (export "dpoly") (param $x f64) (result f64)
    f64.const 3
    local.get $x
    local.get $x
    f64.mul
    f64.mul
    f64.const 2
    f64.sub)

  (func $iterate_newton (export "iterate_newton") (param $x0 f64) (param $iterations i32) (result f64)
    (local $x f64)
    (local $i i32)

    local.get $x0
    local.set $x
    i32.const 0
    local.set $i

    block $exit
      loop $loop
        local.get $i
        local.get $iterations
        i32.ge_s
        br_if $exit

        local.get $x
        call $dpoly
        f64.abs
        f64.const 0.0000001
        f64.lt
        br_if $exit

        local.get $x
        local.get $x
        call $poly
        local.get $x
        call $dpoly
        f64.div
        f64.sub
        local.set $x

        local.get $i
        i32.const 1
        i32.add
        local.set $i

        br $loop
      end
    end

    local.get $x)
)
