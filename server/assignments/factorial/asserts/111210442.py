def factorial(n):
  total = 1
  for i in range(n):
    total = total * i
  return total

assert factorial(3) == 6, '>>> factorial(3) # \n\n    # Error: expected\n    #     6\n    # but got\n    #     {0}'.format(factorial(3))
assert factorial(1) == 1, '>>> factorial(1) # \n\n    # Error: expected\n    #     1\n    # but got\n    #     {0}'.format(factorial(1))
assert factorial(2) == 2, '>>> factorial(2) # \n\n    # Error: expected\n    #     2\n    # but got\n    #     {0}'.format(factorial(2))