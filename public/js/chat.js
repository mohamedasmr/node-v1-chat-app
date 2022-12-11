const socket = io()

//Elements
const $messageForm = document.querySelector('#messageform')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemps = document.querySelector('#message-temp').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message elemnt
    const $newMessage = $messages.lastElementChild

    //Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visiable Height
    const VisiableHeight = $messages.offsetHeight


    // Height of messages container
    const contentHeight = $messages.scrollHeight

    //How far that i scrolled
    const scrollOffset = $messages.scrollTop + VisiableHeight

    if (contentHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemps, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm:A")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm:A")
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    }) 
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')
    // disable
    const message = e.target.elements.message.value
    
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        // enable
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})



$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    $locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
}) 


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})