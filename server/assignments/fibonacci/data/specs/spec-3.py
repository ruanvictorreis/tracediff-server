n = int(input())
fib_list = [0, 1]
  
for i in range(n):
  atual = fib_list[-1]
  anterior = fib_list[-2]
  fib_list.append(atual + anterior)
print(fib_list[n])
