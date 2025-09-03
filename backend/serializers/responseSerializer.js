export default class ResponseSerializer {
    tokenResponseSerializers(user, token) {
        var date = new Date(); // Now
        return {
            id: user._id,
            name: user.name,
            surname : user.surname,
            phone : user.phone,
            username: user.username,
            phone: user.phone,
            token: `Bearer ${token}`,
            expiresIn: date.setDate(date.getDate() + 30), // 30 gün vermiştik
        };
    }
}
