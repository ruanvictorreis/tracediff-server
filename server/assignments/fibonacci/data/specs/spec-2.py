n = int(input())
fib_list = [0, 1]
  
for i in range(n):
  size = len(fib_list)
  atual = fib_list[size - 1]
  anterior = fib_list[size - 2]
  fib_list.append(atual + anterior)
print(fib_list[n])
