# quicksearch
quick search on redis source code.
Hard requirement - don't use the readily available solutions like lucene or solar.

Actual Problem statement
------------------------
Code Search Challenge
Implement a fast (subsecond query time) keyword search over the Redis source code. When a word or phrase is given, relevant code snippets and their corresponding source files should show up as results.
What we're looking for
We would like you to write your own algorithm, instead of using an off-the-shelf search solution like Lucene or Solr. Use of general purpose helper libraries (e.g. for basic data structures) is fine.
Feel free to pick any language of your choice.
Bonus points
Allow the user to specify whether the word is part of a function name, parameter list or variable name.
A simple HTTP wrapper API to expose the search interface.
------------------------

Solution:

1. Need to create indexing on source code(redis).
    1.1 We can't use readily available solutions. So need to write custom indexing. Risk factor is accuracy of indexing can't be equivalent to lucene or solar.
        Redis source code is in C programming. Again we can't use available C parsers.
    1.2 Creating our own proper C lexer going to take more time.
    1.3 We can have regex for retrieving the keywords like variables and functions. But it will not equivalent to the C lexer. There might be some miss in searching.
2. Use that index file for querying.
    2.1 Two solutions for the querying index file.
        2.1.1 Load the index file whenever called and find the keyword and related info stored in that index file.
              This is useful if the application invoked as non webserver.
        2.1.2 Load the index file into memory. Use this memory object to find keyword. This is more useful for web server.
    2.2 After getting details from open the result files and return the result snippet.
        2.2.1 sync read of each file from file discriptor zero to specific result line.
        2.2.2 parrallel read of each file from file discriptor zero to specific result line.
        2.2.3 Above two solutions did not give better results when results present in more files.
              So add the file-offset value of the keyword when creating index file. Use that offset to open file instead opening file from zero offset.
              This reduced the 1/3rd of time compare to other two.
    2.3 In problem statement they mentioning about the (subsecond query time).
        2.3.1 We can code like indexing can happen when ever server starts.
              We can also expose api for getting the path of the source and trigger indexing. This is trivial lets ignore.
        2.3.2 Store index file result in memory. We can use the mutimap for quick retrieval. Typically don't have to store the index file in system if we have that in memory. Anyway for debugging purpose we store that.
        2.3.3 I also assume if the same query comes second time response should be quick. In this case we can use expiry cache for the searched query results. Expiry time of results will be 15 mins.
3.  Assumptions
        3.1 - Default index file name - 'tags' - because I just storing the result similar to Ctags result. Ctags default file will be 'tags'.
        3.2 - redis folder will be one level up from server.js file location.
              For Example: \
                             --  \-- quicksearch
                                    \-- server.js
                                 \-- redis
        3.3 - Indexing will happen whenever server started. redis folder name 'redis'. hard coded in server.js
        3.4 - Code snippet will have search result line + 5 lines codes.

#Exposed API - server port number 5000.
Get Api - http://127.0.0.1:5000/quicksearch?keyword=&isfunc=
        To retrieve the code snippets of specific keyword.
        parms
            1. keyword - represents search key
            2. isfunc - should be 'true' if keyword is a function.
        Example: http://127.0.0.1:5000/quicksearch?keyword=redisLrand48&isfunc=true

        Result:
                {
                  "count": 3,
                  "result": [
                    {
                      "fname": "../redis/src/rand.c",
                      "type": "f",
                      "lineNo": 70,
                      "offset": 3256,
                      "snippet": [
                        "int32_t redisLrand48() {",
                        "    next();",
                        "    return (((int32_t)x[2] << (N - 1)) + (x[1] >> 1));",
                        "}",
                        "void redisSrand48(int32_t seedval) {",
                        "    SEED(X0, LOW(seedval), HIGH(seedval));"
                      ]
                    },
                    {
                      "fname": "../redis/src/rand.h",
                      "type": "f",
                      "lineNo": 32,
                      "offset": 1658,
                      "snippet": [
                        "int32_t redisLrand48();",
                        "void redisSrand48(int32_t seedval);",
                        "#define REDIS_LRAND48_MAX INT32_MAX",
                        "#endif"
                      ]
                    },
                    {
                      "fname": "../redis/src/scripting.c",
                      "type": "f",
                      "lineNo": 1097,
                      "offset": 38766,
                      "snippet": [
                        " * rand() replaced by redisLrand48(). */",
                        "int redis_math_random (lua_State *L) {",
                        "  /* the `%' avoids the (rare) case of r==1, and is needed also because on",
                        "     some systems (SunOS!) `rand()' may return a value larger than RAND_MAX */",
                        "  lua_Number r = (lua_Number)(redisLrand48()%REDIS_LRAND48_MAX) /",
                        "                                (lua_Number)REDIS_LRAND48_MAX;"
                      ]
                    }
                  ],
                  "querytime(secs)": 0.006
                }
