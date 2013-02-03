# IceMaze (c) 2012-2013 by Matt Cudmore

examples = {
	"gs0" : [
		"The original Ice Path"
		"EA4PDQ8HQEBAQEBAQEBAQEBAQEBAAAAAAEAAAAAAAAAAQEAAAABAAAAAAAAAAABAQAAAAAAAAABAAAAAAEBAAEAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAABAAEBAAAAAAAAAQAAAAAAAQEAAAAAAAAAAAABAAABAQEAAAABAAAAAAAAAAEBAAABAAAAAAAAAAEAAQEAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAAEBAAAAAAAAAAAAAAAAAQEAAAAAAAEAAAEAAAAAgQEBAQEBAQCAgQEBAQCA="
	]
}

loadExample = (egID) ->
	if eg = examples[egID] then alert "Example: #{eg[0]}"
	else return alert "Example[#{egID}] is undefined"
	setMaze decodeMaze eg[1]
