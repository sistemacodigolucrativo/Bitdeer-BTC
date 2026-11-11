#!/usr/bin/env python3
"""Exercise ticket conversations and authorization against an isolated test server."""
import http.cookiejar, json, urllib.error, urllib.request

BASE='http://127.0.0.1:8765/api/index.php?action='
class Client:
    def __init__(self):
        self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.csrf=''
    def call(self,action,data=None,expected=200):
        payload=None if data is None else json.dumps(data).encode()
        req=urllib.request.Request(BASE+action,data=payload,headers={'Content-Type':'application/json','X-CSRF-Token':self.csrf})
        try:
            with self.opener.open(req) as response: status,response_data=response.status,json.load(response)
        except urllib.error.HTTPError as error: status,response_data=error.code,json.load(error)
        assert status==expected,(action,status,response_data)
        self.csrf=response_data.get('csrfToken',self.csrf)
        return response_data

member=Client();other=Client();admin=Client()
for client,login in [(member,'membertest'),(other,'othertest')]:
    client.call('register',{'login':login,'password':'TestPassword123!','displayName':login},201)
    client.call('login',{'login':login,'password':'TestPassword123!'})
admin.call('login',{'login':'ciadmin','password':'TestPassword123!'})
ticket=member.call('support.ticket.create',{'subject':'Preciso de ajuda','message':'Minha dúvida inicial de atendimento.'},201)['ticket']['id']
other.call('support.ticket.reply',{'ticketId':ticket,'message':'Não autorizado'},404)
admin.call('admin.support.reply',{'ticketId':ticket,'message':'Resposta do suporte'})
member.call('support.ticket.reply',{'ticketId':ticket,'message':'Muito obrigado, outra dúvida'})
member_replies=member.call('support.tickets.mine')['tickets'][0]['replies']
admin_replies=next(t for t in admin.call('admin.support.tickets')['tickets'] if t['id']==ticket)['replies']
assert member_replies==admin_replies and len(member_replies)==2
assert {reply['author'] for reply in member_replies}=={'admin','member'}
admin.call('admin.support.manage',{'ticketId':ticket,'operation':'close'})
member.call('support.ticket.reply',{'ticketId':ticket,'message':'Não permitido'},409)
assert len(member.call('support.tickets.mine')['tickets'][0]['replies'])==2
print('PASS: conversation, visibility, ownership and closed-ticket protection')
