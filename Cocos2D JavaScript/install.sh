#!/bin/sh

# vim:ff=unix

if which npm > /dev/null
then
    echo "NPM is installed. You should probably install Cocos2D JavaScript as an npm package using this command instead:\n\n    npm install -g .\n"

    read -p "Continue anyway? (y/n) : " yn
    case $yn in
        [Nn]* ) exit;;
        [Yy]* ) break;;
        * ) echo "Enter 'y' or 'n'"
    esac
fi

DIR=`dirname $0`

read -p "Where should I install to? (/usr/local/cocos2d-javascript/) : " install_to

if [ -z "$install_to" ]
then
    install_to='/usr/local/cocos2d-javascript/'
fi

echo "Installing to: $install_to"

mkdir -p "$install_to"

cd $DIR

# Set Internal Field Separator to new lines only
IFS=$'
'
for file in `find * \( ! -regex '.*/\..*' \) -type f`
do
    dst="$install_to/$file"
    dst_dir=`dirname "$dst"`
    if [ ! -d "$dst_dir" ]
    then
        mkdir -p "$dst_dir"
    fi

    cp "$file" "$dst"
done
unset IFS

cd -

echo "All files copied."

ln -s "$install_to/bin/cocos" "/usr/local/bin/cocos"

echo "Symlinked 'cocos' executable to /usr/local/bin/cocos\n"

echo "Installation complete\n\n"

echo "You should now be able to type 'cocos' and get a list of available commands."


