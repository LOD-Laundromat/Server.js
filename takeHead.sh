#!/bin/bash
completeFile="/home/lodlaundromat/generatedConfig.json"
tmpFile="tmpFile"
if [ -z $1 ]; then
	echo "no args given"
exit
fi


targetFile="./head_$1"


#store last line in file
head -n $1 $completeFile > $targetFile;

#copy last line from target
tail -n 1 $targetFile > $tmpFile;

#delete last line from target
sed -i '$ d' $targetFile;

#re-add modified last line
sed 's/\(.*\),$/\1/' $tmpFile >> $targetFile;
echo "}}" >> $targetFile;

echo "Written to file $targetFile"
rm $tmpFile; 

